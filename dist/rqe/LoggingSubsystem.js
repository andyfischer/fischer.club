"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLoggingSubsystem = exports.ConsoleLoggingSubsystem = exports.EmptyLoggingSubsystem = void 0;
class EmptyLoggingSubsystem {
    isEnabled() { return false; }
    put(category, text) { }
    enable(category) { }
}
exports.EmptyLoggingSubsystem = EmptyLoggingSubsystem;
class ConsoleLoggingSubsystem {
    constructor(graph) {
        this.categoryEnabled = graph.newTable({
            attrs: {
                category: {},
                enabled: {}
            },
            funcs: ['category -> enabled'],
        });
    }
    isEnabled() { return true; }
    enable(category) {
        this.categoryEnabled.put({ category: category, enabled: true });
    }
    put(category, text) {
        const setting = this.categoryEnabled.one({ category });
        if (setting && setting.enabled)
            console.log(`[${category}] ${text}`);
    }
}
exports.ConsoleLoggingSubsystem = ConsoleLoggingSubsystem;
function setupLoggingSubsystem(graph) {
    graph.logging = new ConsoleLoggingSubsystem(graph);
}
exports.setupLoggingSubsystem = setupLoggingSubsystem;
//# sourceMappingURL=LoggingSubsystem.js.map