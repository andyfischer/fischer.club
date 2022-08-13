"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableMount = void 0;
const Setup_1 = require("../Setup");
const Update_1 = require("../Update");
function getTableMount(table, opts = {}) {
    const schema = table.schema;
    const attrs = Object.keys(schema.attrs);
    const readonly = !!opts.readonly;
    if (attrs.length === 0)
        return [];
    let commonAttrs = {};
    for (const [attr, config] of Object.entries(schema.attrs)) {
        let required = config.required;
        if (config.generate)
            required = false;
        commonAttrs[attr] = { required };
    }
    const getHandler = (step) => {
        let filter = null;
        for (const tag of step.tuple.tags) {
            if (tag.attr && tag.value.t === 'str_value') {
                filter = filter || {};
                filter[tag.attr] = tag.value.str;
            }
        }
        const items = filter === null ? table.scan() : table.where(filter);
        for (const item of items) {
            step.put(item);
        }
    };
    function updateBinding(basedOn) {
        return {
            attrs: {
                ...basedOn.attrs,
                'update!': { required: true },
            },
            run: (step) => {
                let filter = null;
                const updateBody = step.tuple.getAttr('update!').value;
                for (const tag of step.tuple.tags) {
                    if (tag.attr === "update!")
                        continue;
                    if (tag.attr && tag.value.t === 'str_value') {
                        filter = filter || {};
                        filter[tag.attr] = tag.value.str;
                    }
                }
                table.update(filter, item => {
                    (0, Update_1.updateItemUsingQuery)(step.graph, item, updateBody);
                });
            }
        };
    }
    function deleteBinding(basedOn) {
        return {
            attrs: {
                ...basedOn.attrs,
                'delete!': { required: true },
            },
            run: (step) => {
                let filter = null;
                for (const tag of step.tuple.tags) {
                    if (tag.attr === "delete!")
                        continue;
                    if (tag.attr && tag.value.t === 'str_value') {
                        filter = filter || {};
                        filter[tag.attr] = tag.value.str;
                    }
                }
                table.delete(filter);
            },
        };
    }
    const points = [];
    const defaultGet = (0, Setup_1.toMountSpec)({
        attrs,
        name: schema.name || null,
        run: getHandler,
    });
    points.push(defaultGet);
    if (!readonly) {
        const put = {
            attrs: {
                ...commonAttrs,
                'put!': { required: true },
            },
            run: (step) => {
                const item = step.args();
                delete item['put!'];
                table.put(item);
            }
        };
        points.push(put);
        points.push(updateBinding(defaultGet));
        points.push(deleteBinding(defaultGet));
    }
    points.push({
        attrs: {
            ...commonAttrs,
            'listener-stream': { required: true },
        },
        run(step) {
            const stream = table.startListenerStream(step);
            step.output.put({ 'listener-stream': stream });
            step.output.close();
        }
    });
    for (const decl of schema.funcs || []) {
        const bind = (0, Setup_1.toTableBind)(decl, getHandler);
        for (const [attr, config] of Object.entries(schema.attrs)) {
            if (!bind.attrs[attr]) {
                bind.attrs[attr] = { required: false };
            }
        }
        points.push(bind);
        if (!readonly) {
            points.push(updateBinding(bind));
            points.push(deleteBinding(bind));
        }
    }
    if (opts.namespace) {
        for (const attr of opts.namespace)
            for (const point of points)
                point.attrs[attr] = { required: true };
    }
    return points;
}
exports.getTableMount = getTableMount;
//# sourceMappingURL=table.js.map