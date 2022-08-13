import { Step } from './Step';
import { Graph } from './Graph';
import { Stream } from './Stream';
export declare function trackNewListenStream(step: Step, stream: Stream): void;
export declare function closeWithResourceTag(graph: Graph, tag: string): void;
