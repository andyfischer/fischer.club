"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSchemaUpdateListener = void 0;
function addSchemaUpdateListener(graph, serve, onSchemaChange) {
    graph.addSchemaListener(schemaChange => {
        if (schemaChange.verb === 'update') {
            const moduleId = schemaChange.item.id;
            const changedPoints = schemaChange.item.points;
            const updatedSpec = {
                points: []
            };
            for (const changedPoint of changedPoints) {
                if (serve.shouldServe(changedPoint.spec)) {
                    updatedSpec.points.push({
                        ...changedPoint.spec,
                        module: null,
                        run: null,
                    });
                }
            }
            onSchemaChange(moduleId, updatedSpec);
        }
    }, { backlog: false });
}
exports.addSchemaUpdateListener = addSchemaUpdateListener;
//# sourceMappingURL=ProtocolCommon.js.map