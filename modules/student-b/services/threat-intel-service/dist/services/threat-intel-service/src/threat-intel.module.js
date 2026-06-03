"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const threat_indicator_entity_1 = require("./domain/entities/threat-indicator.entity");
const threat_indicator_repository_1 = require("./domain/repositories/threat-indicator.repository");
const threat_intel_controller_1 = require("./controllers/threat-intel.controller");
const virustotal_adapter_1 = require("./services/adapter/virustotal.adapter");
const misp_adapter_1 = require("./services/adapter/misp.adapter");
const custom_feed_adapter_1 = require("./services/adapter/custom-feed.adapter");
const caching_proxy_1 = require("./services/proxy/caching.proxy");
const rate_limit_proxy_1 = require("./services/proxy/rate-limit.proxy");
const access_control_proxy_1 = require("./services/proxy/access-control.proxy");
const threat_intel_service_1 = require("./services/threat-intel.service");
const threat_intel_cache_service_1 = require("./services/threat-intel-cache.service");
const threat_intel_event_publisher_1 = require("./events/threat-intel-event.publisher");
const redis_module_1 = require("./config/redis.module");
let ThreatIntelModule = class ThreatIntelModule {
};
exports.ThreatIntelModule = ThreatIntelModule;
exports.ThreatIntelModule = ThreatIntelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([threat_indicator_entity_1.ThreatIndicatorEntity]),
            config_1.ConfigModule,
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    timeout: 10000,
                    maxRedirects: 3,
                    headers: {
                        'User-Agent': 'SDA-Pro-ThreatIntel/1.0',
                    },
                }),
            }),
            redis_module_1.RedisModule,
        ],
        controllers: [threat_intel_controller_1.ThreatIntelController],
        providers: [
            threat_indicator_repository_1.ThreatIndicatorRepository,
            virustotal_adapter_1.VirusTotalAdapter,
            misp_adapter_1.MISPAdapter,
            custom_feed_adapter_1.CustomFeedAdapter,
            threat_intel_cache_service_1.ThreatIntelCacheService,
            threat_intel_event_publisher_1.ThreatIntelEventPublisher,
            threat_intel_service_1.ThreatIntelService,
            {
                provide: 'THREAT_INTEL_PROVIDER',
                useFactory: (vtAdapter, mispAdapter, cacheService, config) => {
                    const accessControlProxy = new access_control_proxy_1.AccessControlProxy(vtAdapter, config);
                    const rateLimitProxy = new rate_limit_proxy_1.RateLimitProxy(accessControlProxy, config);
                    const cachingProxy = new caching_proxy_1.CachingProxy(rateLimitProxy, cacheService);
                    return cachingProxy;
                },
                inject: [virustotal_adapter_1.VirusTotalAdapter, misp_adapter_1.MISPAdapter, threat_intel_cache_service_1.ThreatIntelCacheService, config_1.ConfigService],
            },
        ],
        exports: [threat_intel_service_1.ThreatIntelService],
    })
], ThreatIntelModule);
//# sourceMappingURL=threat-intel.module.js.map