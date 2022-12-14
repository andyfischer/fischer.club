
import ws from 'ws'
import HTTP from 'http'
import express from 'express'
import { IDSource } from '../rqe/utils/IDSource'
import { newTable, func, query } from '../rqe'
import { runCommandLineProcess } from '../rqe/node'
import cors from 'cors'
import { ConcurrencyPool } from '../rqe/utils/ConcurrencyPool'
import { randomHex } from '../rqe/utils/randomHex'

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

    countThisPeriod: number = 0
    periodStartedAt: number = null

    thisPeriodTimeout: any

    blockedCalls: {
        resolve: any
        promise: any
    }[] = []

    constructor({ period, maxPerPeriod }) {
        this.period = period;
        this.maxPerPeriod = maxPerPeriod;
    }

    async wait() {
        this.maybePrepareTimeout();
        this.countThisPeriod++;

        if (this.countThisPeriod > this.maxPerPeriod) {
            console.log('RateLimiter - count too high at ', this.countThisPeriod);
            let resolve;

            let promise = new Promise(r => {
                resolve = r;
            });

            this.blockedCalls.push({ resolve, promise });

            await promise;
            return;
        }

        console.log('RateLimiter - no limit');
    }

    maybePrepareTimeout() {
        if (!this.thisPeriodTimeout) {
            this.periodStartedAt = Date.now();
            this.thisPeriodTimeout = setTimeout(() => this.onPeriodEnd(), this.period);
        }
    }

    onPeriodEnd() {
        this.thisPeriodTimeout = null;
        this.periodStartedAt = null;
        this.countThisPeriod = 0;

        if (this.blockedCalls.length > 0) {

            let callsToResolveNow;

            if (this.blockedCalls.length > this.maxPerPeriod) {
                callsToResolveNow = this.blockedCalls.slice(0, this.maxPerPeriod);
                this.blockedCalls = this.blockedCalls.slice(this.maxPerPeriod);
                this.maybePrepareTimeout();
            } else {
                callsToResolveNow = this.blockedCalls;
                this.blockedCalls = [];
            }

            for (const call of callsToResolveNow) {
                this.countThisPeriod++;

                try {
                    call.resolve();
                } catch (e) {
                    console.error(e);
                }
            }
        }
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
    rateLimiter = new RateLimiter({ period: 1000, maxPerPeriod: 50});

    constructor(send: any) {
        this.send = send;
    }

    onMessage(message) {
        const statusMessage = message?.body?.statusMessage;
        const requestId = message?.header?.requestId;

        console.log('reply from minecraft: ', statusMessage || message);

        if (statusMessage && statusMessage.indexOf("Too many commands have been requested") !== -1) {
            console.log("server replied 'too many commands'");
            this.pauseTimer.startPause(100);

            const command = this.outgoingCommands.get(requestId);
            console.log('retrying: ', command);

            setTimeout((() => {
                this.sendCommand(command);
            }), 100);
        }

        this.outgoingCommands.delete(requestId);
    }

    async sendCommand(cmd) {

        const requestId = nextRequestId.take();

        await this.pauseTimer.maybeWait();
        await this.rateLimiter.wait();

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
const TestRateLimiter = new RateLimiter({ period: 1000, maxPerPeriod: 50 });

func('[v2] test_rate_limiter $count', async (count) => {
    const testId = randomHex(5);

    for (let i=0; i < count; i++) {
        await TestRateLimiter.wait();
        console.log(`firing test ${testId}, i = ${i}`);
    }
});


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
});


