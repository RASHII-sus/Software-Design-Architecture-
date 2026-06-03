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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoIPHandler = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const enrichment_handler_abstract_1 = require("./enrichment-handler.abstract");
const KNOWN_MALICIOUS_RANGES = new Set([
    '185.220.',
    '198.98.',
    '91.108.',
]);
let GeoIPHandler = class GeoIPHandler extends enrichment_handler_abstract_1.EnrichmentHandler {
    constructor(httpService, config) {
        super();
        this.httpService = httpService;
        this.config = config;
        this.threatIntelUrl = this.config.get('app.threatIntelServiceUrl', 'http://localhost:3002');
    }
    getHandlerName() {
        return 'GeoIPHandler';
    }
    async doEnrich(alert) {
        const ip = alert.normalizedData.sourceIp;
        if (!ip) {
            this.logger.debug(`[GeoIPHandler] No source IP in alert ${alert.id} — passing through`);
            return {
                alert,
                enriched: false,
                handlerName: this.getHandlerName(),
                skipped: true,
                skipReason: 'NO_IP_ADDRESS',
                durationMs: 0,
            };
        }
        const geoContext = await this.lookupGeoIP(ip);
        const enrichedAlert = {
            ...alert,
            enrichmentContext: {
                ...alert.enrichmentContext,
                geoIp: geoContext,
            },
        };
        this.logger.debug(`[GeoIPHandler] Enriched ${alert.id} — IP: ${ip} → ${geoContext.country ?? 'UNKNOWN'} ` +
            `(malicious range: ${geoContext.isKnownMaliciousRange})`);
        return {
            alert: enrichedAlert,
            enriched: true,
            handlerName: this.getHandlerName(),
            skipped: false,
            durationMs: 0,
            metadata: { ip, country: geoContext.country, isp: geoContext.isp },
        };
    }
    async lookupGeoIP(ip) {
        if (this.isPrivateIp(ip)) {
            return {
                ip,
                country: 'INTERNAL',
                countryCode: 'INT',
                isKnownMaliciousRange: false,
            };
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`http://ip-api.com/json/${ip}`, {
                timeout: 3000,
            }));
            const data = response.data;
            const isKnownMaliciousRange = this.checkMaliciousRange(ip);
            return {
                ip,
                country: data.country,
                countryCode: data.countryCode,
                city: data.city,
                latitude: data.lat,
                longitude: data.lon,
                isp: data.isp,
                isKnownMaliciousRange,
            };
        }
        catch (err) {
            this.logger.warn(`[GeoIPHandler] Geo lookup failed for ${ip}: ${err.message} — using fallback`);
            return {
                ip,
                isKnownMaliciousRange: this.checkMaliciousRange(ip),
            };
        }
    }
    isPrivateIp(ip) {
        return (ip.startsWith('10.') ||
            ip.startsWith('172.16.') ||
            ip.startsWith('192.168.') ||
            ip === '127.0.0.1' ||
            ip === '::1');
    }
    checkMaliciousRange(ip) {
        for (const range of KNOWN_MALICIOUS_RANGES) {
            if (ip.startsWith(range))
                return true;
        }
        return false;
    }
};
exports.GeoIPHandler = GeoIPHandler;
exports.GeoIPHandler = GeoIPHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], GeoIPHandler);
//# sourceMappingURL=geo-ip.handler.js.map