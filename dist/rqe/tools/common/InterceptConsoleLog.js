"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
if (config_1.StackTraceAllConsoleLogs) {
    let originalConsoleLog = console.log;
    console.log = (...strs) => {
        originalConsoleLog.apply(null, strs);
        const stackLines = ((new Error()).stack + '').replace(/^Error:/, '');
        originalConsoleLog('console.log call: ' + stackLines);
    };
    let originalConsoleWarn = console.warn;
    console.warn = (...strs) => {
        originalConsoleWarn.apply(null, strs);
        const stackLines = ((new Error()).stack + '').replace(/^Error:/, '');
        originalConsoleWarn('console.warn call: ' + stackLines);
    };
    let originalConsoleError = console.error;
    console.error = (...strs) => {
        originalConsoleError.apply(null, strs);
        const stackLines = ((new Error()).stack + '').replace(/^Error:/, '');
        originalConsoleError('console.error call: ' + stackLines);
    };
}
//# sourceMappingURL=InterceptConsoleLog.js.map