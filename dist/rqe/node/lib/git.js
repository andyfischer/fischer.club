"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalGraph_1 = require("../../globalGraph");
(0, globalGraph_1.func)('git exec: cmd -> cwd stdout', (task) => {
    task.async();
    const ChildProcess = require('child_process');
    const cmd = task.get('cmd');
    const args = cmd.split(' ');
    const proc = ChildProcess.spawn(args[0], args.slice(1), {
        stdio: 'pipe',
        cwd: task.getOptional('cwd', null),
        shell: true
    });
    proc.stdout.on('data', data => {
        data = data.toString()
            .replace(/\n$/, '')
            .split('\n');
        for (const line of data)
            task.put({ stdout: line });
    });
    proc.stdout.on('end', () => {
        task.done();
    });
});
(0, globalGraph_1.func)('git branches: -> ref_name commit commit_date cwd', async (task) => {
    const command = `git for-each-ref --sort=committerdate refs/heads/ --format='%(HEAD) %(refname:short) %(objectname) %(committerdate:unix)'`;
    const output = task.query(`git exec $cmd stdout`, { cmd: command });
    for await (const { stdout } of output) {
        const isCurrent = /^ \*/.exec(stdout);
        const fields = stdout.slice(2).split(' ');
        task.put({ 'ref_name': fields[0], commit: fields[1], 'commit_date': fields[2] });
    }
});
(0, globalGraph_1.func)('git files_diff: from_ver to_ver -> cwd filename change', async ({ from_ver, to_ver }, task) => {
    const output = await task.query({ attrs: { git: null, exec: null, cmd: `git diff --name-status ${from_ver} ${to_ver}`, stdout: null } });
    for (const line of output.column('stdout')) {
        const changeLetter = line[0];
        const filename = line.slice(2);
        task.put({ filename, change: changeLetter });
    }
});
(0, globalGraph_1.func)('git files_diff unstaged: -> cwd filename change', async (task) => {
    const output = await task.query({ attrs: { git: null, exec: null, cmd: `git diff --name-status`, stdout: null } });
    for (const line of output.column('stdout')) {
        const changeLetter = line[0];
        const filename = line.slice(2);
        task.put({ filename, change: changeLetter });
    }
});
(0, globalGraph_1.func)('git files_diff staged: cwd filename change', async (task) => {
    const output = await task.query({ attrs: { git: null, exec: null, cmd: `git diff --name-status --staged`, stdout: null } });
    for (const line of output.column('stdout')) {
        const changeLetter = line[0];
        const filename = line.slice(2);
        task.put({ filename, change: changeLetter });
    }
});
(0, globalGraph_1.func)('git: trunk_ref', async (task) => {
    return { trunk_ref: 'origin/staging' };
});
(0, globalGraph_1.func)('git files-changed-from-trunk: -> cwd filename', async (task) => {
});
//# sourceMappingURL=git.js.map