"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectHttpFetchClient = void 0;
const Stream_1 = require("../Stream");
const MountPoint_1 = require("../MountPoint");
function connectHttpFetchClient(config) {
    if (config.use.discoverApi)
        throw new Error("HTTP fetch client doesn't currently support discoverApi");
    function sendRequest(query, input) {
        const output = new Stream_1.Stream();
        const options = {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(query.toObject()),
        };
        (async () => {
            const response = await config.fetch(config.url, options);
            const text = await response.text();
            if (response.status !== 200) {
                let responseData = text;
                try {
                    responseData = JSON.parse(responseData);
                }
                catch (err) { }
                output.putError(responseData);
                output.done();
                return;
            }
            const items = text === '' ? [] : JSON.parse(text);
            for (const item of items)
                output.put(item);
            output.done();
        })();
        return output;
    }
    const provider = config.graph.addProvider(sendRequest);
    const module = config.graph.mount(config.use.expectedApi.map((point) => {
        point = (0, MountPoint_1.resolveLooseMountPointSpec)(point);
        return {
            ...point,
            providerId: provider.provider_id,
        };
    }));
}
exports.connectHttpFetchClient = connectHttpFetchClient;
//# sourceMappingURL=HttpFetchProvider.js.map