
import ws from 'ws'
import HTTP from 'http'
import express from 'express'
import { IDSource } from '../rqe/utils/IDSource'
import { newTable, func, query } from '../rqe'
import { runCommandLineProcess } from '../rqe/node'
import cors from 'cors'
import { ConcurrencyPool } from '../rqe/utils/ConcurrencyPool'

const connections = newTable<{ id: string, ws: any, send: (msg) => void }>({
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

    webServer.post('/run', (req, res) => {

        console.log('body:', req.body);

        const { commands } = req.body;
        for (const cmd of commands)
            query('send $cmd', { cmd });

        res.sendStatus(200);
    });

    webServer.use((req, res, next) => {
        reply(res, 404, {});
    });

    return webServer;
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

        const onMessage = (evt) => {
            const msg = JSON.parse(evt.data);

            console.log('got message: ', msg);
        }

        const onClose = () => {
            console.log(`closed connection #${id}`);
            connections.delete({ id });
        }

        connections.put({ id, ws, send });

        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
    });

    server.on('request', setupWebServer());
    server.listen(4300);
    console.log('started listening on port: 4300');

    return server;
}

const server = startServer();
const pool = new ConcurrencyPool(100);

func('[v2] send $cmd', async (cmd) => {

    let anyFound = false;

    await pool.run(async () => {

    for (const { send } of connections.scan()) {
        anyFound = true;
        const requestId = nextRequestId.take();
        send({
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

    await new Promise(resolve => setTimeout(resolve, 1));

    if (!anyFound) {
        console.warn("warning: no connected server to run: " + cmd);
    }
    });
});

runCommandLineProcess({
    startRepl: {
        prompt: 'bedrockws~ '
    }
})
