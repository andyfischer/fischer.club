"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FutureAttr = exports.FutureValue = void 0;
const Errors_1 = require("./Errors");
const Item_1 = require("./Item");
const Query_1 = require("./Query");
const Errors_2 = require("./Errors");
class FutureValue {
    constructor(originalQuery) {
        this.msg = null;
        this.originalQuery = originalQuery;
    }
    callback(callback) {
        if (this.downstream)
            throw new Error("FutureValue already has a downstream");
        this.downstream = callback;
        if (this.msg) {
            callback(this.msg);
        }
    }
    receive(msg) {
        if (this.msg)
            return;
        switch (msg.t) {
            case 'item':
            case 'error':
            case 'done':
                this.msg = msg;
                if (this.downstream)
                    this.downstream(msg);
                return;
        }
    }
    sync() {
        if (this.msg == null) {
            let message = `Query didn't finish synchronously`;
            if (this.originalQuery)
                message += ` (${(0, Query_1.toQuery)(this.originalQuery).toQueryString()})`;
            throw (0, Errors_2.newError)({
                message,
                fromQuery: this.originalQuery,
            });
        }
        switch (this.msg.t) {
            case 'item':
                return this.msg.item;
            case 'error':
                throw (0, Errors_1.newErrorFromItems)([this.msg.item]);
            case 'done': {
                let message = `Query didn't produce any value`;
                if (this.originalQuery)
                    message += ` (${(0, Query_1.toQuery)(this.originalQuery).toQueryString()})`;
                throw (0, Errors_2.newError)({
                    message,
                    fromQuery: this.originalQuery,
                });
            }
        }
    }
    then(onResolve, onReject) {
        let promise = new Promise((resolve, reject) => {
            this.callback(msg => {
                switch (msg.t) {
                    case 'item':
                        resolve(msg.item);
                        break;
                    case 'error':
                        reject(msg.item);
                        break;
                    case 'done': {
                        let message = `Query didn't produce any value`;
                        if (this.originalQuery)
                            message += ` (${(0, Query_1.toQuery)(this.originalQuery).toQueryString()})`;
                        reject((0, Errors_2.newError)({
                            message,
                            fromQuery: this.originalQuery,
                        }));
                        break;
                    }
                }
            });
        });
        if (onResolve || onResolve)
            promise = promise.then(onResolve, onReject);
        return promise;
    }
    attr(attr) {
        return new FutureAttr(this, attr);
    }
}
exports.FutureValue = FutureValue;
class FutureAttr {
    constructor(value, attr) {
        this.value = value;
        this.attr = attr;
    }
    sync() {
        return (0, Item_1.get)(this.value.sync(), this.attr);
    }
    then(onResolve, onReject) {
        let promise = this.value.then(item => (0, Item_1.get)(item, this.attr));
        if (onResolve || onResolve)
            promise = promise.then(onResolve, onReject);
        return promise;
    }
}
exports.FutureAttr = FutureAttr;
//# sourceMappingURL=FutureValue.js.map