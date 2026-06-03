"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('externalApis', () => ({
    virusTotal: {
        apiKey: process.env.VIRUSTOTAL_API_KEY ?? '',
        baseUrl: process.env.VIRUSTOTAL_BASE_URL ?? 'https://www.virustotal.com/api/v3',
        rateLimitPerMinute: parseInt(process.env.VIRUSTOTAL_RATE_LIMIT_PER_MINUTE ?? '4', 10),
    },
    misp: {
        baseUrl: process.env.MISP_BASE_URL ?? '',
        authKey: process.env.MISP_AUTH_KEY ?? '',
        rateLimitPerMinute: parseInt(process.env.MISP_RATE_LIMIT_PER_MINUTE ?? '60', 10),
    },
    customFeed: {
        url: process.env.CUSTOM_FEED_URL ?? '',
        apiKey: process.env.CUSTOM_FEED_API_KEY ?? '',
        rateLimitPerMinute: parseInt(process.env.CUSTOM_FEED_RATE_LIMIT_PER_MINUTE ?? '30', 10),
    },
}));
//# sourceMappingURL=external-apis.config.js.map