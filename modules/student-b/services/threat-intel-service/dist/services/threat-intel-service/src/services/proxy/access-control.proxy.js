"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlProxy = void 0;
const common_1 = require("@nestjs/common");
class AccessControlProxy {
    constructor(realProvider, config) {
        this.realProvider = realProvider;
        this.config = config;
        this.logger = new common_1.Logger(AccessControlProxy.name);
        this.internalApiKey = this.config.get('app.apiKeySecret', 'dev-secret');
    }
    getProviderName() {
        return `AccessControlProxy(${this.realProvider.getProviderName()})`;
    }
    supports(type) {
        return this.realProvider.supports(type);
    }
    async checkReputation(indicator, type, context) {
        this.validateAccess(context);
        this.logger.debug(`[AccessControlProxy] Access granted for requester=${context?.requesterId ?? 'internal'}` +
            ` → delegating to ${this.realProvider.getProviderName()}`);
        return this.realProvider.checkReputation(indicator, type);
    }
    validateAccess(context) {
        if (!context)
            return;
        if (!context.apiKey) {
            throw new common_1.UnauthorizedException('Access denied: API key is required to use threat intelligence services.');
        }
        if (context.apiKey !== this.internalApiKey) {
            this.logger.warn(`[AccessControlProxy] Invalid API key attempt from requester=${context.requesterId ?? 'unknown'}`);
            throw new common_1.ForbiddenException('Access denied: Invalid API key for threat intelligence service.');
        }
    }
}
exports.AccessControlProxy = AccessControlProxy;
//# sourceMappingURL=access-control.proxy.js.map