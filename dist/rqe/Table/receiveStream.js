"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableReceiveStreamEvent = void 0;
function tableReceiveStreamEvent(table, event) {
    if (table.isDuringPatch) {
        if (event.t === 'done') {
            table.isDuringPatch = false;
            table.pendingPatchEvents = [];
            return;
        }
        if (event.t === 'finish_patch') {
            for (const event of table.pendingPatchEvents) {
                switch (event.t) {
                    case 'start_patch':
                        if (event.replaceAll)
                            table.deleteAll();
                        break;
                    case 'item':
                        table.put(event.item);
                        break;
                    case 'error':
                        table.putError(event.item);
                        break;
                    case 'header':
                        table.putHeader(event.item);
                        break;
                    case 'delete':
                        table.delete(event.item);
                        break;
                    case 'patch_mode':
                        break;
                }
            }
            table.isDuringPatch = false;
            table.pendingPatchEvents = [];
            return;
        }
        table.pendingPatchEvents.push(event);
        return;
    }
    switch (event.t) {
        case 'item':
            table.put(event.item);
            break;
        case 'error':
            table.putError(event.item);
            break;
        case 'done':
            break;
        case 'header':
            table.putHeader(event.item);
            break;
        case 'patch_mode':
            break;
        case 'start_patch':
            table.isDuringPatch = true;
            table.pendingPatchEvents = [event];
            break;
        case 'finish_patch':
            throw new Error("table wasn't expecting finish_patch");
        case 'schema':
            break;
        default:
            throw new Error("unhandled case in Stream.callback: " + event.t);
    }
}
exports.tableReceiveStreamEvent = tableReceiveStreamEvent;
//# sourceMappingURL=receiveStream.js.map