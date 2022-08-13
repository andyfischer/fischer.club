
import { toTableBind, toMountSpec } from '../Setup'
import { Table } from '../Table'
import { Step } from '../Step'
import { MountPointSpec } from '../MountPoint'
import { QueryTuple } from '../QueryTuple'
import { updateItemUsingQuery } from '../Update'
import { trackNewListenStream } from '../Listeners'

export interface TableMountConfig {
    readonly?: boolean
    namespace?: string[]
}

export function getTableMount(table: Table, opts: TableMountConfig = {}): MountPointSpec[] {
    
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

    const getHandler = (step: Step) => {

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

    function updateBinding(basedOn: MountPointSpec): MountPointSpec {
        return {
            attrs: {
                ...basedOn.attrs,
                'update!': { required: true },
            },
            run: (step: Step) => {

                let filter = null;
                const updateBody = step.tuple.getAttr('update!').value as QueryTuple;

                for (const tag of step.tuple.tags) {
                    if (tag.attr === "update!")
                        continue;
                    if (tag.attr && tag.value.t === 'str_value') {
                        filter = filter || {};
                        filter[tag.attr] = tag.value.str;
                    }
                }

                table.update(filter, item => {
                    updateItemUsingQuery(step.graph, item, updateBody);
                });
            }
        }
    }

    function deleteBinding(basedOn: MountPointSpec): MountPointSpec {
        return {
            attrs: {
                ...basedOn.attrs,
                'delete!': { required: true },
            },
            run: (step: Step) => {
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

    const points: MountPointSpec[] = [];

    // Default bind(s) with all attrs.
    const defaultGet = toMountSpec({
        attrs,
        name: schema.name || null,
        run: getHandler,
    });

    points.push(defaultGet);

    if (!readonly) {
      // put!
      const put: MountPointSpec = {
        attrs: {
            ...commonAttrs,
            'put!': { required: true },
        },
        run: (step: Step) => {
            const item = step.args();
            delete item['put!'];
            table.put(item);
        }
      };

      points.push(put);
      points.push(updateBinding(defaultGet));
      points.push(deleteBinding(defaultGet));
    }

    // Listener stream
    points.push({
        attrs: {
            ...commonAttrs,
            'listener-stream': { required: true },
        },
        run(step: Step) {
            const stream = table.startListenerStream(step);
            step.output.put({ 'listener-stream': stream });
            step.output.close();
        }
    })

    // Add binds for every declared func.
    for (const decl of schema.funcs || []) {
        const bind = toTableBind(decl, getHandler);

        // Add the other attrs as possible outputs.
        for (const [ attr, config ] of Object.entries(schema.attrs)) {
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
                point.attrs[attr] = { required: true }
    }

    return points;
}
