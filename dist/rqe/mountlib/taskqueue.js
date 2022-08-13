"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskQueueMount = void 0;
const table_1 = require("./table");
const Table_1 = require("../Table");
const CommandLineApp_1 = require("../node/CommandLineApp");
function getTaskQueueMount(config) {
    const workers = new Table_1.Table({
        attrs: {
            worker_id: { generate: true },
        }
    });
    const tasks = new Table_1.Table({
        attrs: {
            task_id: { generate: true },
            status: {},
            task_query: { required: false },
            in_progress_worker_id: { required: false },
        },
        funcs: [
            '->',
            'task_id -> ',
        ]
    });
    const workersMount = (0, table_1.getTableMount)(workers);
    const tasksMount = (0, table_1.getTableMount)(tasks, { namespace: ['tasks'] });
    const newWorker = {
        attrs: {
            new_worker: {}
        }
    };
    const grabNext = {
        attrs: {
            'grab_next!': { required: true },
            worker_id: { required: true },
            task_query: {},
        },
        async run(step) {
            const worker_id = step.get('worker_id');
            const task = (await step.query(config.namespace.join(' ') + ' tasks task_id status task_query ' +
                `| where status=ready`)).one();
            if (!task) {
                return null;
            }
            await step.query(config.namespace.join(' ') + ' tasks $task_id ' +
                '| update status=in_progress $in_progress_worker_id', { task_id: task.task_id, in_progress_worker_id: worker_id });
            return {
                ...task,
                worker_id,
            };
        }
    };
    const completeTask = {
        attrs: {
            'complete!': { required: true },
            task_id: { required: true },
            task_result: {},
        },
        async run(step) {
            const task_id = step.get('task_id');
            const task = (await step.query(config.namespace.join(' ') + ' tasks $task_id status', { task_id })).one();
            if (!task)
                throw new Error("task not found");
            if (task.status !== 'in_progress')
                throw new Error("task is not in status: in_progress");
            return await step.query(config.namespace.join(' ') + ' tasks $task_id ' +
                '| update status=done', { task_id });
        },
    };
    const points = [
        ...workersMount,
        ...tasksMount,
        newWorker,
        grabNext,
        completeTask,
    ];
    for (const attr of config.namespace)
        for (const point of points)
            point.attrs[attr] = { required: true };
    return points;
}
exports.getTaskQueueMount = getTaskQueueMount;
if (require.main === module) {
    (0, CommandLineApp_1.runCommandLineProcess)({
        setupGraph(graph) {
            graph.mount(getTaskQueueMount({
                namespace: ['task_test'],
            }));
            graph.query('task_test tasks put! status=ready');
        }
    });
}
//# sourceMappingURL=taskqueue.js.map