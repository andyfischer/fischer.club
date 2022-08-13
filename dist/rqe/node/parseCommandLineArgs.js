"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommandLineArgs = void 0;
const tokenizeString_1 = require("../parser/lexer/tokenizeString");
const parseQueryTag_1 = require("../parser/parseQueryTag");
const TaggedValue_1 = require("../TaggedValue");
function parseCommandLineArgs(args) {
    const tokens = (0, tokenizeString_1.lexStringToIterator)(args);
    const result = {
        tags: [],
        flags: [],
    };
    let recentFlagName = null;
    while (!tokens.finished()) {
        tokens.skipSpaces();
        if (tokens.nextText() === '-q') {
            tokens.consume();
            tokens.skipSpaces();
            result.query = tokens.consumeAsTextWhile(() => true);
            continue;
        }
        const tag = (0, parseQueryTag_1.parseQueryTagFromTokens)(tokens);
        if (tag.isFlag) {
            result.flags.push({
                name: tag.attr,
                value: (0, TaggedValue_1.unwrapTagged)(tag.value),
            });
        }
        else {
            result.tags.push(tag);
        }
    }
    return result;
}
exports.parseCommandLineArgs = parseCommandLineArgs;
//# sourceMappingURL=parseCommandLineArgs.js.map