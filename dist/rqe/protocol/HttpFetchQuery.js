"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchClient = void 0;
const Stream_1 = require("../Stream");
class FetchClient {
    constructor(config) {
        this.config = config;
    }
    query(query, params, opts = {}) {
        const stream = new Stream_1.Stream();
        let options = {
            body: JSON.stringify({
                query,
                params,
                one: opts.one,
            }),
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...(this.config.headers || {}),
            }
        };
        if (this.config.beforeSend)
            options = this.config.beforeSend(options) || options;
        (async () => {
            const fetchResponse = await this.config.fetch(this.config.endpoint, options);
            const text = await fetchResponse.text();
            let responseData = null;
            try {
                responseData = JSON.parse(text);
            }
            catch (err) {
                console.error(err);
                console.error({ text });
                stream.putError({
                    errorType: 'http_protocol_error',
                    message: `bad response data (couldn't parse as JSON)`,
                    data: [{
                            text,
                        }],
                });
                stream.done();
                return;
            }
            if (responseData.error) {
                stream.putError({
                    errorType: 'http_protocol_error',
                    message: responseData.error,
                    data: [{
                            responseData,
                        }]
                });
                stream.done();
                return;
            }
            if (responseData.events === undefined) {
                stream.putError({
                    errorType: 'http_protocol_error',
                    message: `bad response data (didn't have .events)`,
                    data: [{
                            responseData,
                        }]
                });
                stream.done();
                return;
            }
            for (const event of responseData.events) {
                stream.receive(event);
            }
            stream.done();
        })();
        return stream;
    }
}
exports.FetchClient = FetchClient;
//# sourceMappingURL=HttpFetchQuery.js.map