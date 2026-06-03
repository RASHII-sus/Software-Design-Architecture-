"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrichmentHandler = void 0;
const common_1 = require("@nestjs/common");
class EnrichmentHandler {
    constructor() {
        this.nextHandler = null;
        this.logger = new common_1.Logger(this.constructor.name);
    }
    setNext(handler) {
        this.nextHandler = handler;
        return handler;
    }
    async handle(alert, results) {
        const start = Date.now();
        const result = await this.doEnrich(alert);
        results.push({ ...result, durationMs: Date.now() - start });
        if (result.skipped && result.skipReason === 'DUPLICATE') {
            this.logger.warn(`[Pipeline] Chain STOPPED at ${this.getHandlerName()} — reason: ${result.skipReason}`);
            return result.alert;
        }
        if (this.nextHandler) {
            return this.nextHandler.handle(result.alert, results);
        }
        return result.alert;
    }
}
exports.EnrichmentHandler = EnrichmentHandler;
//# sourceMappingURL=enrichment-handler.abstract.js.map