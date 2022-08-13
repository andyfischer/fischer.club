"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItemUsingQuery = void 0;
const Item_1 = require("./Item");
const TaggedValue_1 = require("./TaggedValue");
const Item_2 = require("./Item");
const Stream_1 = require("./Stream");
function updateItemUsingQuery(graph, item, updateStep) {
    for (const tag of updateStep.tags) {
        if (tag.value.t === 'query') {
            const nestedQuery = tag.value;
            if (!(0, Item_2.isItem)((0, Item_1.get)(item, tag.attr)))
                throw new Error("expected nested object for: " + tag.attr);
            let $input;
            if (nestedQuery.isTransform) {
                $input = Stream_1.Stream.fromList([(0, Item_1.get)(item, tag.attr)]);
            }
            const result = graph.query(nestedQuery, { $input }).sync();
            result.throwErrors();
            const updated = result.one();
            (0, Item_1.set)(item, tag.attr, updated);
            continue;
        }
        item[tag.attr] = (0, TaggedValue_1.unwrapTagged)(tag.value);
    }
}
exports.updateItemUsingQuery = updateItemUsingQuery;
//# sourceMappingURL=Update.js.map