"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverse = void 0;
function run(step) {
    const { input, output } = step;
    input.aggregate(output, items => {
        return items.reverse();
    });
}
exports.reverse = {
    run,
};
//# sourceMappingURL=reverse.js.map