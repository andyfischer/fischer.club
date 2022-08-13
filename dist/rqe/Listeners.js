"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeWithResourceTag = exports.trackNewListenStream = void 0;
const FailureTracking_1 = require("./FailureTracking");
function trackNewListenStream(step, stream) {
    var _a;
    const graph = step.graph;
    let listener_id = step.getOptional('listener-id', null);
    let listen_stream_id = graph.nextListenStreamId.take();
    let resourceTags = (_a = step.context) === null || _a === void 0 ? void 0 : _a.resourceTags;
    if (!listener_id && !resourceTags)
        return;
    let hasClosed = false;
    function close_callback() {
        if (!hasClosed) {
            stream.close();
            hasClosed = true;
            if (listener_id) {
                graph.builtins.listener_close_signal().delete({
                    listen_stream_id
                });
            }
            if (resourceTags) {
                graph.builtins.resource_tag_to_close_signal().delete({
                    listen_stream_id
                });
            }
        }
    }
    if (listener_id) {
        graph.builtins.listener_close_signal().put({
            listener_id,
            listen_stream_id,
            close_callback,
        });
    }
    if (resourceTags) {
        for (const tag of resourceTags) {
            graph.builtins.resource_tag_to_close_signal().put({
                'resource_tag': tag,
                listen_stream_id,
                close_callback,
            });
        }
    }
}
exports.trackNewListenStream = trackNewListenStream;
function closeWithResourceTag(graph, tag) {
    if (!graph.builtins.has('resource_tag_to_close_signal'))
        return;
    for (const { close_callback } of graph.builtins.resource_tag_to_close_signal()) {
        try {
            close_callback();
        }
        catch (e) {
            (0, FailureTracking_1.recordUnhandledException)(e, graph);
        }
    }
}
exports.closeWithResourceTag = closeWithResourceTag;
//# sourceMappingURL=Listeners.js.map