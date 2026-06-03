"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingProxy = void 0;
const common_1 = require("@nestjs/common");
class CachingProxy {
    constructor(realProvider, cacheService) {
        this.realProvider = realProvider;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(CachingProxy.name);
    }
    getProviderName() {
        return `CachingProxy(${this.realProvider.getProviderName()})`;
    }
    supports(type) {
        return this.realProvider.supports(type);
    }
    async checkReputation(indicator, type) {
        const providerName = this.realProvider.getProviderName();
        const cached = await this.cacheService.get(indicator, type, providerName);
        if (cached) {
            this.logger.debug(`[CachingProxy] CACHE HIT — ${indicator} (${type}) from ${providerName}`);
            return cached;
        }
        this.logger.debug(`[CachingProxy] CACHE MISS — delegating to ${providerName} for ${indicator}`);
        const result = await this.realProvider.checkReputation(indicator, type);
        await this.cacheService.set(result);
        return result;
    }
}
exports.CachingProxy = CachingProxy;
//# sourceMappingURL=caching.proxy.js.map