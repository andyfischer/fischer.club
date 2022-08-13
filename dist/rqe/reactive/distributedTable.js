"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDistributedTable = exports.applyChange = void 0;
const Schema_1 = require("../Schema");
const randomHex_1 = require("../utils/randomHex");
const Errors_1 = require("../Errors");
function applyChange(table, change) {
    switch (change.verb) {
        case 'put':
            table.put(change.item, {
                writer: change.writer,
            });
            break;
        case 'delete':
            table.delete(change.item, {
                writer: change.writer,
            });
            break;
        default:
            throw new Error("unrecognized verb: " + change.verb);
    }
}
exports.applyChange = applyChange;
function connectDistributedTable(params) {
    const graph = params.graph;
    const sourceTable = params.source;
    const sourceSchema = sourceTable.schema;
    const myClientId = 'client-' + (0, randomHex_1.randomHex)(8);
    let pendingSendTimer = null;
    const [uniqueAttr, uniqueAttrConfig] = (0, Schema_1.findUniqueAttr)(sourceSchema);
    if (!uniqueAttr) {
        throw new Errors_1.TableSchemaIssue(sourceTable, "couldn't find a unique attr");
    }
    const syncStatus = graph.newTable({
        attrs: {
            [uniqueAttr]: {
                unique: {
                    onConflict: 'overwrite'
                }
            },
            last_write_by: {},
            pending_submit: {},
            deleted: {},
        }
    });
    function maybeQueueSend() {
        if (!pendingSendTimer && params.delayToSyncMs) {
            pendingSendTimer = setTimeout(submit, params.delayToSyncMs);
        }
    }
    function submit() {
        pendingSendTimer = null;
        const out = [];
        for (const syncItem of syncStatus.scanWhere({ pending_submit: true })) {
            syncItem.pending_submit = false;
            if (syncItem.deleted) {
                out.push({ verb: 'delete', item: { [uniqueAttr]: syncItem[uniqueAttr] }, writer: myClientId });
            }
            else {
                const sourceItem = sourceTable.one({ [uniqueAttr]: syncItem[uniqueAttr] });
                if (!sourceItem)
                    throw new Error(`sourceItem not found on ${sourceTable.name} for ${uniqueAttr}=${syncItem[uniqueAttr]}`);
                out.push({ verb: 'put', item: sourceItem, writer: myClientId });
            }
        }
        params.onOutgoingData(out);
    }
    sourceTable.addChangeListener((event) => {
        if (event.writer === myClientId)
            return;
        switch (event.verb) {
            case 'put':
                syncStatus.put({
                    [uniqueAttr]: event.item[uniqueAttr],
                    last_write_by: myClientId,
                    pending_submit: true,
                    deleted: false,
                });
                break;
            case 'delete':
                syncStatus.put({
                    [uniqueAttr]: event.item[uniqueAttr],
                    last_write_by: myClientId,
                    pending_submit: true,
                    deleted: true,
                });
                break;
        }
    });
    return {
        submitNow: submit,
        clientId: myClientId,
        receiveIncomingData(changes) {
            for (const change of changes) {
                applyChange(sourceTable, change);
                syncStatus.put({
                    [uniqueAttr]: change.item[uniqueAttr],
                    last_write_by: change.writer,
                    pending_submit: false,
                });
            }
        }
    };
}
exports.connectDistributedTable = connectDistributedTable;
//# sourceMappingURL=distributedTable.js.map