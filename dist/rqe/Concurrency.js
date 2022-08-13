"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamingAggregate = exports.aggregateMultiple = exports.streamingTransform = void 0;
const Enums_1 = require("./Enums");
function streamingTransform(from, receiver, callback, options = {}) {
    let incomingHasFinished = false;
    let unfinishedStreams = 0;
    const incomingQueue = [];
    function startItem(item) {
        const thisResult = callback(item);
        unfinishedStreams++;
        thisResult.sendTo({
            receive(msg) {
                switch (msg.t) {
                    case Enums_1.c_done:
                        unfinishedStreams--;
                        maybePopFromQueue();
                        if (incomingHasFinished && unfinishedStreams === 0) {
                            receiver.receive({ t: 'done' });
                        }
                        break;
                    case Enums_1.c_item:
                        receiver.receive({ t: 'item', item: msg.item });
                        break;
                    default:
                        receiver.receive(msg);
                }
            }
        });
    }
    function atConcurrencyLimit() {
        if (options.maxConcurrency) {
            return unfinishedStreams >= options.maxConcurrency;
        }
        return false;
    }
    function maybePopFromQueue() {
        while (incomingQueue.length > 0 && !atConcurrencyLimit()) {
            const next = incomingQueue.shift();
            startItem(next);
        }
    }
    from.sendTo({
        receive(msg) {
            switch (msg.t) {
                case Enums_1.c_done:
                    incomingHasFinished = true;
                    if (incomingHasFinished && unfinishedStreams === 0) {
                        receiver.receive({ t: 'done' });
                    }
                    break;
                case Enums_1.c_item: {
                    const item = msg.item;
                    if (atConcurrencyLimit()) {
                        incomingQueue.push(item);
                        return;
                    }
                    startItem(item);
                    break;
                }
                default:
                    receiver.receive(msg);
                    break;
            }
        }
    });
}
exports.streamingTransform = streamingTransform;
function aggregateMultiple(streams, output, onReadyHandler) {
    const progress = [];
    let hasCalledDone = false;
    function maybeDone() {
        if (hasCalledDone)
            return;
        for (const entry of progress)
            if (entry.result === null)
                return;
        hasCalledDone = true;
        const results = [];
        for (const entry of progress)
            results.push(entry.result);
        onReadyHandler(results, output);
    }
    for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        const statusEntry = { result: null };
        progress.push(statusEntry);
        stream.callback(result => {
            statusEntry.result = result;
            maybeDone();
        });
    }
}
exports.aggregateMultiple = aggregateMultiple;
function streamingAggregate(streams, receiver) {
    let waitingForDone = streams.length;
    for (let i = 0; i < streams.length; i++) {
        streams[i].sendTo({
            receive(msg) {
                try {
                    receiver({
                        t: 'aggregateData',
                        streamIndex: i,
                        msg
                    });
                }
                catch (err) {
                    console.error(err);
                }
                if (msg.t === 'done') {
                    waitingForDone--;
                    if (waitingForDone === 0) {
                        receiver({
                            t: 'done'
                        });
                    }
                }
            }
        });
    }
}
exports.streamingAggregate = streamingAggregate;
//# sourceMappingURL=Concurrency.js.map