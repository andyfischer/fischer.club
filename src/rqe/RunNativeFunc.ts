
import { QueryExecutionContext } from './Graph'
import { MountPointRef } from './MountPoint'
import { Stream, BackpressureStop, StreamEvent } from './Stream'
import { QueryTuple } from './QueryTuple'
import { Graph } from './Graph'
import { Step } from './Step'
import { VerboseLogFilteredEmptyValue } from './config'
import { captureExceptionAsErrorItem } from './Errors'
import { c_done } from './Enums'

export function runNativeFunc(graph: Graph, context: QueryExecutionContext, pointRef: MountPointRef, tuple: QueryTuple, input: Stream, output: Stream) {

    const point = graph.getMountPoint(pointRef);
    if (!point)
        throw new Error("mount point ref not resolved: " + JSON.stringify(pointRef));

    if (!point.attrs)
        throw new Error("not a valid MountPoint object: " + point);

    let step = new Step({
        graph,
        tuple,
        afterVerb: tuple,
        input,
        output,
        context,
    });

    if (graph.hookNativeFunc) {
        const result = graph.hookNativeFunc(step);
        if (result?.t === 'done')
            return;
    }

    if (!point.callback)
        throw new Error("MountPoint has no .callback");

    try {
        let data: any = point.callback(step);

        handleCallbackOutput(step, tuple, data);

    } catch (e) {

        if ((e as BackpressureStop).backpressure_stop) {
            // Function is deliberately being killed by a BackpressureStop exception. Not an error.
            step.output.sendDoneIfNeeded();
            return;
        }

        const errorItem = captureExceptionAsErrorItem(e, { fromQuery: tuple });
        step.output.sendErrorItem(errorItem);
        step.output.sendDoneIfNeeded();
        return;
    }

    // Automatically call 'done' if the call is not async.
    if (!step.declaredAsync && !step.declaredStreaming) {
        step.output.sendDoneIfNeeded();
    }
}

function handleCallbackOutput(step: Step, tuple: QueryTuple, data: any) {
    
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
            // Implicit async
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
            } else if (data.t === 'table') {
                for (const item of data.scan())
                    step.put(item);
            } else if (Array.isArray(data)) {
                for (const el of data)
                    step.put(el);
            } else {
                step.put(data);
            }

            if (!step.declaredStreaming)
                step.output.sendDoneIfNeeded();

        })
        .catch(e => {

            if ((e as BackpressureStop).backpressure_stop) {
                // Function is deliberately being killed by a BackpressureStop exception. Not an error.
                step.output.sendDoneIfNeeded();
                return;
            }

            // console.error(e);

            const errorItem = captureExceptionAsErrorItem(e, {fromQuery: tuple});
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
