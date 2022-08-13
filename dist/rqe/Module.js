"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
const MountPoint_1 = require("./MountPoint");
const IDSource_1 = require("./utils/IDSource");
function hasSpecificValue(point) {
    for (const attr of Object.values(point.attrs))
        if (attr.specificValue)
            return true;
    return false;
}
class Module {
    constructor(graph) {
        this.points = [];
        this.pointIds = new IDSource_1.IDSourceNumber();
        this.graph = graph;
        this.moduleId = graph.nextModuleId.take();
    }
    redefine(newSpecs) {
        const oldPoints = this.points;
        const newPoints = [];
        this.pointsById = new Map();
        this.pointsByDeclString = new Map();
        for (const pointSpec of newSpecs) {
            pointSpec.localId = pointSpec.localId || this.pointIds.take();
            if (this.pointsById.has(pointSpec.localId))
                throw new Error("module already has a point with id: " + pointSpec.localId);
            const point = new MountPoint_1.MountPoint(this.graph, pointSpec, this);
            newPoints.push(point);
            this.pointsById.set(pointSpec.localId, point);
            const declString = (0, MountPoint_1.pointSpecToDeclString)(pointSpec);
            if (this.pointsByDeclString.has(declString)) {
                throw new Error("module already has a point with decl: " + declString);
            }
            this.pointsByDeclString.set(declString, point);
        }
        this.points = newPoints;
        this.graph.onModuleChange();
        for (const listener of this.graph.schemaListeners) {
            this.sendUpdate(listener);
        }
    }
    clear() {
        this.redefine([]);
    }
    sendUpdate(listener) {
        listener({
            verb: 'update',
            item: {
                id: this.moduleId,
                points: this.points,
            }
        });
    }
}
exports.Module = Module;
//# sourceMappingURL=Module.js.map