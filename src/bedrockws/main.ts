
import ws from 'ws'
import { IDSource } from '../rqe/utils/IDSource'
import { newTable, func } from '../rqe'
import { runCommandLineProcess } from '../rqe/node'

const connections = newTable<{ id: string, ws: any, send: (msg) => void }>({
    funcs: [
        'id ->'
    ]
});

const nextRequestId = new IDSource('request-');

function startSocketServer() {
    const wsserver = new ws.Server({
        port: 4300
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

    return wsserver;
}

const server = startSocketServer();

func('[v2] send $cmd', (cmd) => {

    let anyFound = null;

    for (const { send } of connections.scan()) {
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
});

runCommandLineProcess({
    startRepl: {
        prompt: 'bedrockws~ '
    }
})
