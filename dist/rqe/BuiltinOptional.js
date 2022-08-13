"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinTables = void 0;
const Table_1 = require("./Table");
class LazyTable {
    constructor(schema) {
        this.schema = schema;
    }
    get() {
        if (!this.table) {
            this.table = new Table_1.Table(this.schema);
        }
        return this.table;
    }
}
const _definitions = {
    failures: {
        create() {
            return new Table_1.Table({
                attrs: {
                    message: {},
                    check_attrs: {},
                }
            });
        }
    },
    test_case: {
        create() {
            return new Table_1.Table({
                attrs: 'id(generated) description enabled',
                funcs: [
                    'enabled ->'
                ]
            });
        }
    },
    alt_impl: {
        create() {
            return new Table_1.Table({
                attrs: {
                    name: {},
                    enabled: {},
                },
                funcs: [
                    'name ->'
                ]
            });
        }
    },
    func_cache: {
        create() {
            return new Table_1.Table({
                attrs: {
                    func: {},
                    input_tuple: {},
                    output_stream: {},
                    cached_at: {},
                },
                funcs: [
                    'func ->',
                    'func input_tuple ->',
                    'input_tuple ->',
                ]
            });
        }
    },
    listener_close_signal: {
        create() {
            return new Table_1.Table({
                attrs: {
                    listen_stream_id: {},
                    listener_id: {},
                    close_callback: {},
                },
                funcs: [
                    'listener_id ->',
                    'listen_stream_id ->',
                ]
            });
        }
    },
    resource_tag_to_close_signal: {
        create() {
            return new Table_1.Table({
                attrs: {
                    listen_stream_id: {},
                    resource_tag: {},
                    close_callback: {},
                },
                funcs: [
                    'listener_id ->',
                    'listen_stream_id ->',
                ]
            });
        }
    },
};
class BuiltinTables {
    constructor() {
        this.map = new Map();
    }
    get(name) {
        if (!this.map.has(name))
            this.map.set(name, _definitions[name].create());
        return this.map.get(name);
    }
    has(name) {
        return this.map.has(name);
    }
    failures() {
        return this.get('failures');
    }
    testCases() {
        return this.get('test_case');
    }
    altImpl() {
        return this.get('alt_impl');
    }
    funcCache() {
        return this.get('func_cache');
    }
    listener_close_signal() {
        return this.get('listener_close_signal');
    }
    resource_tag_to_close_signal() {
        return this.get('resource_tag_to_close_signal');
    }
}
exports.BuiltinTables = BuiltinTables;
//# sourceMappingURL=BuiltinOptional.js.map