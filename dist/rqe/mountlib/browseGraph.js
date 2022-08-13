"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowse = void 0;
function setupBrowse(graph) {
    return [{
            attrs: {
                browse: {},
                name: { assumeInclude: true },
                attrs: { assumeInclude: true },
                provider_id: { required: false },
            },
            run(step) {
                step.output.putSchema({ name: { type: 'string' }, attrs: { type: 'TableAttrsList' } });
                for (const point of graph.everyMountPoint()) {
                    const attrs = {};
                    for (const [attr, details] of Object.entries(point.attrs))
                        attrs[attr] = details;
                    step.put({
                        attrs,
                        name: point.name,
                        provider_id: point.providerId,
                    });
                }
            }
        }];
}
exports.setupBrowse = setupBrowse;
//# sourceMappingURL=browseGraph.js.map