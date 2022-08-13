import { Graph } from '../../Graph';
import { Table } from '../../Table';
export declare function launchProcessMonitor(graph?: Graph): {
    processes: Table<any>;
    liveProcesses: Table<{
        def_id: string;
        processWrapper: any;
    }>;
};
export declare function startWithCli(): void;
