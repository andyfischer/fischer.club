"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNativeFunc = void 0;
const Step_1 = require("./Step");
const Errors_1 = require("./Errors");
function runNativeFunc(graph, context, pointRef, tuple, input, output) {
    const point = graph.getMountPoint(pointRef);
    if (!point)
        throw new Error("mount point ref not resolved: " + JSON.stringify(pointRef));
    if (!point.attrs)
        throw new Error("not a valid MountPoint object: " + point);
    let step = new Step_1.Step({
        graph,
        tuple,
        afterVerb: tuple,
        input,
        output,
        context,
    });
    if (graph.hookNativeFunc) {
        const result = graph.hookNativeFunc(step);
        if ((result === null || result === void 0 ? void 0 : result.t) === 'done')
            return;
    }
    if (!point.callback)
        throw new Error("MountPoint has no .callback");
    try {
        let data = point.callback(step);
        handleCallbackOutput(step, tuple, data);
    }
    catch (e) {
        if (e.backpressure_stop) {
            step.output.sendDoneIfNeeded();
            return;
        }
        const errorItem = (0, Errors_1.captureExceptionAsErrorItem)(e, { fromQuery: tuple });
        step.output.sendErrorItem(errorItem);
        step.output.sendDoneIfNeeded();
        return;
    }
    if (!step.declaredAsync && !step.declaredStreaming) {
        step.output.sendDoneIfNeeded();
    }
}
exports.runNativeFunc = runNativeFunc;
function handleCallbackOutput(step, tuple, data) {
    if (!data)
        return;
    if (data.t === 'stream') {
        step.streaming();
        data.sendTo(step.output);
        return;
    }
    if (data.t === 'table') {
        for (const item of data.scan())
            step.put(item);
        return;
    }
    if (data.then) {
        if (!step.declaredStreaming) {
            step.async();
        }
        return data.then(data => {
            if (!data) {
                if (!step.declaredStreaming)
                    step.output.sendDoneIfNeeded();
                return;
            }
            if (data.t === 'stream') {
                step.streaming();
                data.sendTo(step.output);
            }
            else if (data.t === 'table') {
                for (const item of data.scan())
                    step.put(item);
            }
            else if (Array.isArray(data)) {
                for (const el of data)
                    step.put(el);
            }
            else {
                step.put(data);
            }
            if (!step.declaredStreaming)
                step.output.sendDoneIfNeeded();
        })
            .catch(e => {
            if (e.backpressure_stop) {
                step.output.sendDoneIfNeeded();
                return;
            }
            const errorItem = (0, Errors_1.captureExceptionAsErrorItem)(e, { fromQuery: tuple });
            step.output.sendErrorItem(errorItem);
            step.output.sendDoneIfNeeded();
            return;
        });
    }
    if (Array.isArray(data)) {
        for (const el of data)
            step.put(el);
        return;
    }
    step.put(data);
}
//# sourceMappingURL=RunNativeFunc.js.map