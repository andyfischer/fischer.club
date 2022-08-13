"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalGraph_1 = require("../../globalGraph");
(0, globalGraph_1.func)('[v2] shell $cmd $cwd? $args? -> stdout stderr error exit_code', (task, cmd, args, cwd) => {
    task.streaming();
    const ChildProcess = require('child_process');
    args = args || [];
    const proc = ChildProcess.spawn(cmd, args, {
        stdio: 'pipe',
        cwd: cwd || null,
        shell: true
    });
    proc.on('error', error => {
        console.log('proc got error');
        task.put({ error });
    });
    proc.on('close', exit_code => {
        task.put({ exit_code });
        task.done();
    });
    proc.stderr.on('data', data => {
        data = data.toString()
            .replace(/\n$/, '')
            .split('\n');
        console.log('shell: ' + data);
        for (const line of data)
            task.put({ stderr: line });
    });
    proc.stdout.on('data', data => {
        data = data.toString()
            .replace(/\n$/, '')
            .split('\n');
        for (const line of data)
            task.put({ stdout: line });
    });
    proc.stdout.on('end', () => {
    });
});
//# sourceMappingURL=shell.js.map