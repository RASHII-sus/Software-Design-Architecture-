"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ThreatIntelCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const redis_module_1 = require("../config/redis.module");
let ThreatIntelCacheService = ThreatIntelCacheService_1 = class ThreatIntelCacheService {
    constructor(redis, config) {
        this.redis = redis;
        this.config = config;
        this.logger = new common_1.Logger(ThreatIntelCacheService_1.name);
        this.defaultTtlSeconds = this.config.get('redis.cacheTtlSeconds', 3600);
    }
    buildCacheKey(indicator, type, source) {
        const parts = ['sda', 'threat-intel', type.toLowerCase(), indicator];
        if (source)
            parts.push(source.toLowerCase());
        return parts.join(':');
    }
    async get(indicator, type, source) {
        const key = this.buildCacheKey(indicator, type, source);
        try {
            const raw = await this.redis.get(key);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            this.logger.debug(`[ThreatIntelCacheService] Cache HIT for key: ${key}`);
            return parsed;
        }
        catch (err) {
            this.logger.warn(`[ThreatIntelCacheService] Cache GET error for ${key}: ${err.message}`);
            return null;
        }
    }
    async set(result, ttlSeconds) {
        const key = this.buildCacheKey(result.indicator, result.indicatorType, result.source);
        const ttl = ttlSeconds ?? this.resolveTtlFromResult(result);
        try {
            await this.redis.set(key, JSON.stringify(result), 'EX', ttl);
            this.logger.debug(`[ThreatIntelCacheService] Cached ${result.indicator} for ${ttl}s`);
        }
        catch (err) {
            this.logger.warn(`[ThreatIntelCacheService] Cache SET error for ${key}: ${err.message}`);
        }
    }
    async invalidate(indicator, type) {
        const pattern = this.buildCacheKey(indicator, type) + ':*';
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.debug(`[ThreatIntelCacheService] Invalidated ${keys.length} keys for ${indicator}`);
            }
            await this.redis.del(this.buildCacheKey(indicator, type));
        }
        catch (err) {
            this.logger.warn(`[ThreatIntelCacheService] Invalidation error: ${err.message}`);
        }
    }
    async getCacheStats() {
        try {
            const keys = await this.redis.keys('sda:threat-intel:*');
            const info = await this.redis.info('memory');
            const memMatch = info.match(/used_memory_human:(.+)/);
            return {
                size: keys.length,
                memoryUsage: memMatch ? memMatch[1].trim() : 'unknown',
            };
        }
        catch {
            return { size: 0, memoryUsage: 'unknown' };
        }
    }
    resolveTtlFromResult(result) {
        if (result.expiresAt) {
            const expiresMs = new Date(result.expiresAt).getTime() - Date.now();
            return Math.max(Math.floor(expiresMs / 1000), 60);
        }
        return this.defaultTtlSeconds;
    }
};
exports.ThreatIntelCacheService = ThreatIntelCacheService;
exports.ThreatIntelCacheService = ThreatIntelCacheService = ThreatIntelCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default,
        config_1.ConfigService])
], ThreatIntelCacheService);
//# sourceMappingURL=threat-intel-cache.service.js.map