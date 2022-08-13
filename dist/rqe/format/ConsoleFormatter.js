"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleFormatter = void 0;
const Stream_1 = require("../Stream");
const IDSource_1 = require("../utils/IDSource");
const TableFormatter_1 = require("./TableFormatter");
const FailureTracking_1 = require("../FailureTracking");
const consoleOutput_1 = require("./terminal/consoleOutput");
class ConsoleFormatter {
    constructor(settings) {
        this.nextTaskId = new IDSource_1.IDSource();
        this.activeTasks = new Map();
        this.flushDelayMs = 1000;
        this.graph = settings.graph;
        this.log = settings.log || console.log;
        this.prompt = settings.prompt;
        this.settings = settings;
        this.mostRecentOutput = 'none';
    }
    newTask() {
        const id = this.nextTaskId.take();
        const incoming = new Stream_1.Stream();
        this.mostRecentOutput = 'submitted';
        const task = {
            id,
            incoming,
            buffer: [],
            flushTimer: null,
            formatState: (0, TableFormatter_1.newTableFormatState)(),
        };
        incoming.sendTo({
            receive: (msg) => {
                switch (msg.t) {
                    case 'schema':
                        task.formatState.schema = msg.item;
                        if (this.graph) {
                            this.graph.query([{ attrs: { ...msg.item, console_format_options: null } }])
                                .sendTo({
                                receive: (msg) => {
                                    switch (msg.t) {
                                        case 'item':
                                            task.formatState.options = msg.item.console_format_options;
                                            break;
                                    }
                                }
                            });
                        }
                        break;
                    case 'item':
                        task.buffer.push(msg.item);
                        if (!task.flushTimer)
                            task.flushTimer = setTimeout(() => this.flushTaskBuffer(task.id), this.flushDelayMs);
                        break;
                    case 'error':
                        this.logError(msg.item);
                        break;
                    case 'done':
                        this.finishTask(id);
                        break;
                }
            }
        });
        this.activeTasks.set(id, task);
        return task;
    }
    logError(error) {
        this.log((0, consoleOutput_1.terminalFormatError)(error));
    }
    printTable(table) {
        const task = this.newTask();
        task.incoming.putTableItems(table);
        task.incoming.done();
    }
    touch() {
        this.flushAllTasks();
        this.printPrompt();
    }
    flushAllTasks() {
        for (const task of this.activeTasks.values()) {
            this.flushTaskBuffer(task.id);
        }
    }
    flushTaskBuffer(id) {
        if (!id)
            throw new Error("missing id");
        const task = this.activeTasks.get(id);
        if (!task) {
            (0, FailureTracking_1.recordFailure)('task_not_found');
            console.warn('task not found? ', id);
            return;
        }
        if (task.flushTimer) {
            clearTimeout(task.flushTimer);
            task.flushTimer = null;
        }
        if (task.buffer.length === 0)
            return;
        const items = task.buffer;
        task.buffer = [];
        const formatted = (0, TableFormatter_1.formatItems)(task.formatState, items);
        (0, TableFormatter_1.updateStateForItems)(task.formatState, formatted);
        const header = (0, TableFormatter_1.formatHeader)(task.formatState);
        const skipHeader = this.mostRecentOutput.t === 'dataWithHeader'
            && this.mostRecentOutput.header == header.key;
        const wasPrompt = this.mostRecentOutput === 'prompt';
        if (this.mostRecentOutput === 'prompt')
            this.log();
        if (!skipHeader)
            header.print(this.log);
        (0, TableFormatter_1.printItems)(task.formatState, formatted, this.log);
        this.mostRecentOutput = { t: 'dataWithHeader', header: header.key };
        if (wasPrompt)
            this.printPrompt();
    }
    preemptiveLog(...args) {
        this.flushAllTasks();
        this.log.apply(null, args);
        if (this.mostRecentOutput === 'prompt') {
            this.mostRecentOutput = 'log';
            this.maybePrintPrompt();
        }
    }
    finishTask(id) {
        this.flushTaskBuffer(id);
        this.activeTasks.delete(id);
        this.printPrompt();
    }
    printPrompt() {
        let prompt = this.prompt;
        const taskCount = this.activeTasks.size;
        if (taskCount == 1) {
            prompt = '1 task running~ ';
        }
        else if (taskCount > 1) {
            prompt = `${taskCount} tasks running~ `;
        }
        if (this.settings.setPrompt)
            this.settings.setPrompt(prompt);
        if (this.settings.printPrompt)
            this.settings.printPrompt();
        this.mostRecentOutput = 'prompt';
    }
    maybePrintPrompt() {
        if (this.mostRecentOutput === 'prompt')
            return;
        this.printPrompt();
    }
}
exports.ConsoleFormatter = ConsoleFormatter;
//# sourceMappingURL=ConsoleFormatter.js.map