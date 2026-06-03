"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitProxy = exports.RateLimitExceededException = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../../../../shared/contracts/enums");
class RateLimitExceededException extends Error {
    constructor(provider, limitPerMinute) {
        super(`Rate limit exceeded for provider ${provider}: ${limitPerMinute} req/min. Retry after 60s.`);
        this.provider = provider;
        this.limitPerMinute = limitPerMinute;
        this.name = 'RateLimitExceededException';
    }
}
exports.RateLimitExceededException = RateLimitExceededException;
class RateLimitProxy {
    constructor(realProvider, config) {
        this.realProvider = realProvider;
        this.config = config;
        this.logger = new common_1.Logger(RateLimitProxy.name);
        this.windowMs = 60_000;
        this.windows = new Map();
        this.limitPerMinute = this.resolveRateLimit(realProvider.getProviderName());
    }
    getProviderName() {
        return `RateLimitProxy(${this.realProvider.getProviderName()})`;
    }
    supports(type) {
        return this.realProvider.supports(type);
    }
    async checkReputation(indicator, type) {
        const providerKey = this.realProvider.getProviderName();
        if (!this.allowRequest(providerKey)) {
            const remaining = this.getRemainingRequests(providerKey);
            this.logger.warn(`[RateLimitProxy] Rate limit reached for ${providerKey}. ` +
                `Limit: ${this.limitPerMinute}/min. Remaining: ${remaining}`);
            throw new RateLimitExceededException(providerKey, this.limitPerMinute);
        }
        this.logger.debug(`[RateLimitProxy] Request allowed for ${providerKey}. ` +
            `Remaining: ${this.getRemainingRequests(providerKey)}/${this.limitPerMinute}`);
        return this.realProvider.checkReputation(indicator, type);
    }
    allowRequest(providerKey) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        if (!this.windows.has(providerKey)) {
            this.windows.set(providerKey, {
                timestamps: [now],
                limitPerMinute: this.limitPerMinute,
            });
            return true;
        }
        const entry = this.windows.get(providerKey);
        entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
        if (entry.timestamps.length >= this.limitPerMinute) {
            return false;
        }
        entry.timestamps.push(now);
        return true;
    }
    getRemainingRequests(providerKey) {
        const entry = this.windows.get(providerKey);
        if (!entry)
            return this.limitPerMinute;
        const now = Date.now();
        const active = entry.timestamps.filter((ts) => ts > now - this.windowMs).length;
        return Math.max(0, this.limitPerMinute - active);
    }
    resolveRateLimit(providerName) {
        const upper = providerName.toUpperCase();
        if (upper.includes(enums_1.ThreatIntelSource.VIRUSTOTAL)) {
            return this.config.get('externalApis.virusTotal.rateLimitPerMinute', 4);
        }
        if (upper.includes(enums_1.ThreatIntelSource.MISP)) {
            return this.config.get('externalApis.misp.rateLimitPerMinute', 60);
        }
        if (upper.includes(enums_1.ThreatIntelSource.CUSTOM_FEED)) {
            return this.config.get('externalApis.customFeed.rateLimitPerMinute', 30);
        }
        return 10;
    }
}
exports.RateLimitProxy = RateLimitProxy;
//# sourceMappingURL=rate-limit.proxy.js.map