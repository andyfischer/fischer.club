"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBuiltinVerb = exports.listEveryVerb = exports.getVerb = exports.everyVerb = void 0;
const add_1 = require("./add");
const count_1 = require("./count");
const count_by_1 = require("./count_by");
const get_1 = require("./get");
const join_1 = require("./join");
const just_1 = require("./just");
const incoming_1 = require("./incoming");
const limit_1 = require("./limit");
const listen_1 = require("./listen");
const last_1 = require("./last");
const need_1 = require("./need");
const one_1 = require("./one");
const order_by_1 = require("./order_by");
const put_1 = require("./put");
const rate_1 = require("./rate");
const rename_1 = require("./rename");
const reverse_1 = require("./reverse");
const run_query_with_provider_1 = require("./run_query_with_provider");
const save_to_csv_1 = require("./save_to_csv");
const then_1 = require("./then");
const trace_1 = require("./trace");
const to_csv_1 = require("./to_csv");
const update_1 = require("./update");
const wait_1 = require("./wait");
const where_1 = require("./where");
const with_1 = require("./with");
const without_1 = require("./without");
const value_1 = require("./value");
let _everyVerb;
function init() {
    _everyVerb = {
        add: add_1.add,
        count: count_1.count,
        count_by: count_by_1.count_by,
        get: get_1.get,
        join: join_1.join,
        just: just_1.just,
        incoming: incoming_1.incoming,
        limit: limit_1.limit,
        listen: listen_1.listen,
        last: last_1.last,
        need: need_1.need,
        one: one_1.one,
        order_by: order_by_1.order_by,
        put: put_1.put,
        rate: rate_1.rate,
        rename: rename_1.rename,
        reverse: reverse_1.reverse,
        run_query_with_provider: run_query_with_provider_1.run_query_with_provider,
        save_to_csv: save_to_csv_1.save_to_csv,
        then: then_1.then,
        to_csv: to_csv_1.to_csv,
        trace: trace_1.trace,
        update: update_1.update,
        wait: wait_1.wait,
        where: where_1.where,
        with: with_1._with,
        without: without_1.without,
        value: value_1.value,
    };
}
function everyVerb() {
    if (!_everyVerb)
        init();
    return _everyVerb;
}
exports.everyVerb = everyVerb;
function getVerb(verb) {
    if (!_everyVerb)
        init();
    return _everyVerb[verb];
}
exports.getVerb = getVerb;
function listEveryVerb() {
    if (!_everyVerb)
        init();
    return Object.keys(_everyVerb);
}
exports.listEveryVerb = listEveryVerb;
function findBuiltinVerb(tuple) {
    for (const tag of tuple.tags)
        if (getVerb(tag.attr))
            return getVerb(tag.attr);
}
exports.findBuiltinVerb = findBuiltinVerb;
//# sourceMappingURL=_list.js.map