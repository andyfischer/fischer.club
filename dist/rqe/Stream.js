"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackpressureStop = exports.Stream = void 0;
const index_1 = require("./Table/index");
const Enums_1 = require("./Enums");
const Errors_1 = require("./Errors");
const IDSource_1 = require("./utils/IDSource");
const Concurrency_1 = require("./Concurrency");
const config_1 = require("./config");
const FutureValue_1 = require("./FutureValue");
const FailureTracking_1 = require("./FailureTracking");
const Errors_2 = require("./Errors");
const nextStreamId = new IDSource_1.IDSourceNumber();
class Stream {
    constructor(graph, label) {
        this.t = 'stream';
        this.downstream = null;
        this.receivedDone = false;
        this.patchMode = null;
        this.graph = graph;
        this.label = label;
        this.id = nextStreamId.take();
    }
    isDone() {
        return this.receivedDone;
    }
    hasDownstream() {
        return !!this.downstream;
    }
    isKnownEmpty() {
        return this.receivedDone && !this.downstream && (!this._backlog || this._backlog.length === 0);
    }
    getDebugLabel() {
        let out = `#${this.id}`;
        if (this.label)
            out += ` (${this.label})`;
        return out;
    }
    receive(data) {
        if (config_1.StreamSuperTrace || config_1.StreamSuperDuperTrace) {
            console.log(`Stream ${this.getDebugLabel()} received:`, data);
            if (config_1.StreamSuperDuperTrace) {
                const trace = ((new Error()).stack + '').replace(/^Error:/, '');
                console.log('at: ' + trace);
            }
        }
        if (data.t === 'item' && data.item.t) {
            throw new Error("Value should not be sent in a Stream, type = " + data.item.t);
        }
        if (data.t !== 'done' && this._backpressureStop) {
            throw new BackpressureStop();
        }
        if (this.receivedDone) {
            if (this.closedWithError) {
                throw new Errors_2.ErrorExtended(this.closedWithError);
            }
            throw new Error(`Stream ${this.getDebugLabel()} received more data after 'done': ` + JSON.stringify(data));
        }
        if (data.t === 'done')
            this.receivedDone = true;
        if (data.t === 'patch_mode') {
            this.patchMode = {
                overflowCheck: null
            };
            if (config_1.StreamOverflowCheck) {
                if (!this.hasDownstream()) {
                    this.patchMode.overflowCheck = setTimeout(() => this.onOverflowCheckTimeout(), config_1.StreamOverflowCheckMs);
                }
            }
        }
        if (this.downstream) {
            try {
                this.downstream.receive(data);
            }
            catch (e) {
                if (!e['backpressure_stop'])
                    this.forceClose((0, Errors_2.captureExceptionAsErrorItem)(e));
                throw e;
            }
        }
        else {
            this._backlog = this._backlog || [];
            this._backlog.push(data);
        }
    }
    sendTo(receiver) {
        if (this.hasDownstream())
            throw new Error("Stream already has a downstream");
        this.downstream = receiver;
        if (config_1.StreamSuperTrace) {
            console.log(`Stream ${this.getDebugLabel()} is now sending to:`, receiver.getDebugLabel ? receiver.getDebugLabel() : 'anonymous receiver');
        }
        if (this._backlog) {
            const backlog = this._backlog;
            delete this._backlog;
            for (const data of backlog) {
                try {
                    this.downstream.receive(data);
                }
                catch (e) {
                    if (!e['backpressure_stop'])
                        this.forceClose((0, Errors_2.captureExceptionAsErrorItem)(e));
                    throw e;
                }
            }
        }
    }
    onOverflowCheckTimeout() {
        if (!this.hasDownstream()) {
            (0, FailureTracking_1.recordFailure)(`Stream entered patch mode but has no listener (after ${config_1.StreamOverflowCheckMs / 1000} sec)`, { graph: this.graph });
            this.forceClose({ errorType: 'patch_mode_listener_timeout' });
        }
    }
    transform(output, callback) {
        this.sendTo({
            receive: (msg) => {
                switch (msg.t) {
                    case Enums_1.c_item:
                        let result = callback(msg.item) || [];
                        if (Array.isArray(result)) {
                            for (const newItem of result)
                                output.receive({ t: Enums_1.c_item, item: newItem });
                        }
                        else {
                            output.receive({ t: Enums_1.c_item, item: result });
                        }
                        break;
                    default:
                        output.receive(msg);
                }
            }
        });
    }
    tap(callback) {
        const stream = new Stream(this.graph);
        this.sendTo({
            receive(msg) {
                callback(msg);
                stream.receive(msg);
            }
        });
        return stream;
    }
    tapItems(callback) {
        const stream = new Stream(this.graph);
        this.sendTo({
            receive(msg) {
                if (msg.t === Enums_1.c_item)
                    callback(msg.item);
                stream.receive(msg);
            }
        });
        return stream;
    }
    toTransform(callback) {
        const output = new Stream(this.graph);
        this.transform(output, callback);
        return output;
    }
    streamingTransform(output, callback, options = {}) {
        (0, Concurrency_1.streamingTransform)(this, output, callback, options);
    }
    aggregate(receiver, callback) {
        let items = [];
        this.sendTo({
            receive: (msg) => {
                switch (msg.t) {
                    case Enums_1.c_item:
                        items.push(msg.item);
                        break;
                    case Enums_1.c_done:
                        const result = callback(items);
                        items = [];
                        for (const item of result)
                            receiver.receive({ t: Enums_1.c_item, item });
                        receiver.receive({ t: Enums_1.c_done });
                        break;
                    default:
                        receiver.receive(msg);
                }
            }
        });
    }
    async collect() {
        return new Promise((resolve, reject) => {
            this.callback(table => {
                if (table.hasError())
                    reject(table.errorsToException());
                else
                    resolve(table);
            });
        });
    }
    async collectWithErrors() {
        return new Promise((resolve, reject) => {
            this.callback(table => {
                resolve(table);
            });
        });
    }
    then(onResolve, onReject) {
        let promise = this.collect();
        if (onResolve || onReject)
            promise = promise.then(onResolve, onReject);
        return promise;
    }
    callback(callback) {
        const result = new index_1.Table({
            name: 'QueryResult'
        });
        let hasCalledDone = false;
        this.sendTo({
            receive(data) {
                if (hasCalledDone) {
                    throw new Error("got message after 'done': " + data.t);
                }
                switch (data.t) {
                    case 'item':
                        result.put(data.item);
                        break;
                    case 'error':
                        result.putError(data.item);
                        break;
                    case 'done':
                        hasCalledDone = true;
                        callback(result);
                        break;
                    case 'header':
                        result.putHeader(data.item);
                        break;
                    case 'schema':
                        break;
                    case 'patch_mode':
                        break;
                    default:
                        throw new Error("unhandled case in Stream.callback: " + data.t);
                }
            }
        });
    }
    sync(opts) {
        let out;
        this.callback(r => { out = r; });
        if (out == null)
            throw new Error("Stream didn't finish synchronously");
        if (opts !== 'with_errors')
            out.throwErrors();
        return out;
    }
    strs() {
        return this.sync().strs();
    }
    *[Symbol.iterator]() {
        const table = this.sync();
        yield* table.scan();
    }
    async *[Symbol.asyncIterator]() {
        let incoming = [];
        let loopTrigger = null;
        this.sendTo({
            receive(msg) {
                incoming.push(msg);
                if (loopTrigger)
                    loopTrigger();
            }
        });
        while (true) {
            const received = incoming;
            incoming = [];
            const nextWait = new Promise(r => { loopTrigger = r; });
            for (const msg of received) {
                switch (msg.t) {
                    case Enums_1.c_done:
                        return;
                    case Enums_1.c_item:
                        yield msg.item;
                        break;
                    case Enums_1.c_error:
                        throw (0, Errors_1.newError)(msg.item);
                }
            }
            await nextWait;
        }
    }
    one() {
        const value = new FutureValue_1.FutureValue();
        this.sendTo(value);
        return value;
    }
    take() {
        if (!this.receivedDone)
            throw new Error("can't take(), stream is not yet closed");
        if (this.downstream)
            throw new Error("can't take(), stream has a downstream");
        const items = [];
        for (const data of this._backlog) {
            switch (data.t) {
                case 'item':
                    items.push(data.item);
            }
        }
        this._backlog = [];
        return items;
    }
    takeItemsAndErrors() {
        if (!this.receivedDone)
            throw new Error("can't take(), stream is not yet closed");
        if (this.downstream)
            throw new Error("can't take(), stream has a downstream");
        const items = [];
        const errors = [];
        for (const data of this._backlog) {
            switch (data.t) {
                case 'item':
                    items.push(data.item);
                    break;
                case 'error':
                    errors.push(data.item);
                    break;
            }
        }
        this._backlog = [];
        return [items, errors];
    }
    putHeader(item) {
        this.receive({ t: 'header', item });
    }
    putSchema(item) {
        this.receive({ t: 'schema', item });
    }
    put(item) {
        this.receive({ t: 'item', item });
    }
    putError(item) {
        this.receive({ t: 'error', item });
    }
    errorAndClose(item) {
        this.receive({ t: 'error', item });
        this.done();
    }
    putTableItems(table) {
        for (const item of table.scan())
            this.put(item);
    }
    sendError(type, data) {
        this.receive({ t: 'error', item: { errorType: type, ...data } });
    }
    sendErrorItem(item) {
        this.receive({ t: 'error', item });
    }
    sendUnhandledError(error) {
        this.sendError('unhandled_error', { message: error.message, stack: error.stack });
    }
    close() {
        this.receive({ t: 'done' });
    }
    forceClose(error) {
        if (this.closedWithError)
            return;
        if (this._backlog) {
            this._backlog = [];
        }
        if (this.patchMode) {
            if (!this.receivedDone) {
                this.close();
            }
        }
        else {
            this.receive({ t: 'error', item: error });
            this.close();
            this.closedWithError = error;
        }
    }
    closeWithError(message) {
        this.receive({ t: 'error', item: { errorType: 'unhandled_error', message } });
        this.receive({ t: 'done' });
    }
    closeWithErrorIfOpen(error) {
        if (!this.receivedDone) {
            this.receive({ t: 'error', item: error });
            this.receive({ t: 'done' });
        }
    }
    closeWithUnhandledError(e) {
        if (this.receivedDone) {
            console.error("Tried to close pipe with error, but pipe is already closed. Error: ", e.stack || e);
            return;
        }
        this.receive({ t: 'error', item: { errorType: 'unhandled_error', message: e.message || e.toString(), stack: e.stack } });
        this.receive({ t: 'done' });
    }
    done() {
        this.receive({ t: 'done' });
    }
    sendDoneIfNeeded() {
        if (!this.receivedDone)
            this.receive({ t: 'done' });
    }
    setBackpressureStop() {
        this._backpressureStop = true;
    }
    static newEmptyStream() {
        const stream = new Stream(null, 'newEmptyStream');
        stream.done();
        return stream;
    }
    static fromList(items) {
        const stream = new Stream(null, 'fromList');
        for (const item of items)
            stream.put(item);
        stream.done();
        return stream;
    }
    static newStreamToReceiver(receiver) {
        const stream = new Stream(null, 'newStreamToReceiver');
        stream.sendTo(receiver);
        return stream;
    }
    static errorToStream(item) {
        const stream = new Stream(null);
        stream.sendErrorItem(item);
        stream.done();
        return stream;
    }
}
exports.Stream = Stream;
class BackpressureStop extends Error {
    constructor() {
        super("Can't put to stream (backpressure stop)");
        this.backpressure_stop = true;
    }
}
exports.BackpressureStop = BackpressureStop;
//# sourceMappingURL=Stream.js.map