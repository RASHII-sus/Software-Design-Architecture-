"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseActionDecorator = void 0;
const common_1 = require("@nestjs/common");
class ResponseActionDecorator {
    constructor(wrappedAction) {
        this.wrappedAction = wrappedAction;
        this.logger = new common_1.Logger(this.constructor.name);
    }
    async execute(target) {
        return this.wrappedAction.execute(target);
    }
    async rollback(context) {
        return this.wrappedAction.rollback(context);
    }
    getType() {
        return this.wrappedAction.getType();
    }
    isReversible() {
        return this.wrappedAction.isReversible();
    }
    describe() {
        return this.wrappedAction.describe();
    }
}
exports.ResponseActionDecorator = ResponseActionDecorator;
//# sourceMappingURL=response-action.decorator.js.map