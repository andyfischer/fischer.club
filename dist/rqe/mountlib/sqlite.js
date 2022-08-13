"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSqliteTableMount = void 0;
const parser_1 = require("../parser");
class SQLiteTableState {
    constructor() {
        this.hasSetupSchema = false;
    }
}
async function maybeSetupSchema(config, state, schema) {
    if (state.hasSetupSchema)
        return;
    return new Promise(resolve => {
        config.db.all(`SELECT name FROM sqlite_master WHERE name='${config.tableName}'`, (found) => {
            if (found && found.length !== 0) {
                resolve(null);
                return;
            }
            const lines = [];
            for (const attr of Object.keys(schema)) {
                lines.push(`${attr} TEXT`);
            }
            const cmd = `CREATE TABLE ${config.tableName}(` +
                lines.join(',\n ') +
                ');';
            if (config.debugSql)
                console.log('sql:', cmd);
            config.db.run(cmd, () => {
                state.hasSetupSchema = true;
                resolve(null);
            });
        });
    });
}
function quote(s) {
    s = s + '';
    s = s.replace(/'/g, `''`);
    return `'${s}'`;
}
async function handleGet(config, step) {
    step.streaming();
    const whereLines = [];
    for (const [attr, value] of Object.entries(step.args())) {
        if (value !== null) {
            whereLines.push(`${attr} = ${quote(value)}`);
        }
    }
    let cmd = `SELECT * from ${config.tableName}`;
    if (whereLines.length > 0) {
        cmd += ' WHERE ' + whereLines.join(' AND ');
    }
    cmd += ';';
    if (config.debugSql)
        console.log('sql:', cmd);
    config.db.each(cmd, ((err, row) => {
        if (err) {
            console.log({ err });
            step.putError(err);
        }
        else {
            step.put(row);
        }
    }), () => {
        step.done();
    });
}
async function handlePut(config, schema, state, step) {
    await maybeSetupSchema(config, state, schema);
    const columns = [];
    const values = [];
    const item = step.args();
    for (const [attr, value] of Object.entries(item)) {
        if (attr === 'put!')
            continue;
        if (value === null)
            continue;
        columns.push(attr);
        values.push(`${quote(value)}`);
    }
    const cmd = `INSERT INTO ${config.tableName} (${columns.join(',')}) ` +
        `VALUES (${values.join(',')});`;
    if (config.debugSql)
        console.log('sql:', cmd);
    config.db.run(cmd);
}
async function handleDelete(config, schema, state, step) {
    await maybeSetupSchema(config, state, schema);
    const columns = [];
    const values = [];
    const item = step.args();
    const whereLines = [];
    for (const [attr, value] of Object.entries(step.args())) {
        if (value !== null) {
            whereLines.push(`${attr} = ${quote(value)}`);
        }
    }
    let cmd = `DELETE FROM ${config.tableName}`;
    if (whereLines.length > 0)
        cmd += ` WHERE ${whereLines}`;
    cmd += ';';
    if (config.debugSql)
        console.log('sql:', cmd);
    config.db.run(cmd);
}
function getSqliteTableMount(config) {
    const points = [];
    const state = new SQLiteTableState();
    const tableDef = (0, parser_1.parseQueryTupleWithErrorCheck)(config.attrs);
    const schema = tableDef.toItemValue();
    if (!config.tableName)
        config.tableName = config.location.replace(' ', '_');
    const location = (0, parser_1.parseTableDecl)(config.location);
    const funcStrs = [
        '-> ' + config.attrs,
        ...config.funcs,
    ];
    for (const funcStr of funcStrs) {
        const func = (0, parser_1.parseTableDecl)(funcStr);
        let run = (step) => handleGet(config, step);
        for (const attr of Object.values(location.attrs))
            attr.requiresValue = false;
        const attrs = {
            ...location.attrs,
            ...func.attrs,
        };
        if (attrs['put!']) {
            run = (step) => handlePut(config, schema, state, step);
            attrs['put!'] = { required: true };
        }
        if (attrs['delete!']) {
            run = (step) => handleDelete(config, schema, state, step);
            attrs['delete!'] = { required: true };
        }
        const spec = {
            attrs,
            run,
        };
        points.push(spec);
    }
    return points;
}
exports.getSqliteTableMount = getSqliteTableMount;
//# sourceMappingURL=sqlite.js.map