
import ws from 'ws'
import HTTP from 'http'
import express from 'express'
import { IDSource } from '../rqe/utils/IDSource'
import { newTable, func, query } from '../rqe'
import { runCommandLineProcess } from '../rqe/node'
import cors from 'cors'
import { ConcurrencyPool } from '../rqe/utils/ConcurrencyPool'

const connections = newTable<{ id: string, ws: any, connection: ServerConnection }>({
    funcs: [
        'id ->'
    ]
});

const nextRequestId = new IDSource('request-');

function setupWebServer() {

    const webServer = express();
    webServer.use(cors({ origin: true }));
    webServer.use(express.json());

    function reply(res, status, data) {
        res.status(status);
        res.contentType('application/json');
        res.end(JSON.stringify(data));
    }

    webServer.post('/run', async (req, res) => {

        const { commands } = req.body;
        for (const cmd of commands) {
            await new Promise(resolve => setTimeout(resolve, 1));
            query('send $cmd', { cmd });
        }

        res.sendStatus(200);
    });

    webServer.use((req, res, next) => {
        reply(res, 404, {});
    });

    return webServer;
}

class RateLimiter {
    period: number
    maxPerPeriod: number
    
    periodStartedAt: number
    timeout: any

    constructor({ period, maxPerPeriod }) {
        this.period = period;
        this.maxPerPeriod = maxPerPeriod;
    }

    async wait() {
    }
}

class PauseTimer {

    timeout: any

    resolveWait: any
    waitPromise: any

    startPause(ms) {
        if (this.timeout)
            clearTimeout(this.timeout);

        if (!this.resolveWait) {
            this.waitPromise = new Promise(resolveWait => {
                this.resolveWait = resolveWait;
            });
        }

        this.timeout = setTimeout((() => {
            const resolveWait = this.resolveWait;

            this.resolveWait = null;
            this.waitPromise = null;

            if (resolveWait)
                resolveWait();
        }), ms);
    }

    async maybeWait() {
        if (this.waitPromise) {
            await this.waitPromise;
        }
    }
}

class ServerConnection {
    outgoingCommands = new Map();
    send: any
    pauseTimer = new PauseTimer();

    constructor(send: any) {
        this.send = send;
    }

    onMessage(message) {
        const statusMessage = message?.body?.statusMessage;
        const requestId = message?.header?.requestId;
        if (statusMessage && statusMessage.indexOf("Too many commands have been requested") !== -1) {
            console.log("server replied 'too many commands'");
            this.pauseTimer.startPause(100);

            const command = this.outgoingCommands.get(requestId);
            console.log('retrying: ', command);
            this.sendCommand(command);
        }

        this.outgoingCommands.delete(requestId);
    }

    async sendCommand(cmd) {

        const requestId = nextRequestId.take();

        await this.pauseTimer.maybeWait();

        this.send({
            header: {
                requestId,
                messagePurpose: 'commandRequest',
                version: 1,
            },
            body: {
                commandLine: cmd,
                version: 1,
            }
        });

    }
}

function startServer() {

    const server = HTTP.createServer();

    const wsserver = new ws.Server({
        server,
    });

    const nextConnectionId = new IDSource();

    wsserver.on('connection', ws => {
        const id = nextConnectionId.take();

        console.log(`received connection #${id}`);

        const send = (msg) => {
            ws.send(JSON.stringify(msg));
        }

        const connection = new ServerConnection(send);

        const onMessage = (evt) => {
            const msg = JSON.parse(evt.data);
            connection.onMessage(msg);
            console.log('got message: ', msg);
        }

        const onClose = () => {
            console.log(`closed connection #${id}`);
            connections.delete({ id });
        }

        connections.put({ id, ws, connection });

        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
    });

    server.on('request', setupWebServer());
    server.listen(4300);
    console.log('started listening on port: 4300');

    return server;
}

const server = startServer();

func('[v2] send $cmd', async (cmd) => {
    let anyFound = false;

    for (const { connection } of connections.scan()) {
        anyFound = true;
        connection.sendCommand(cmd);
    }

    if (!anyFound) {
        console.warn("warning: no connected server to run: " + cmd);
    }
});

runCommandLineProcess({
    startRepl: {
        prompt: 'bedrockws~ '
    }
})
