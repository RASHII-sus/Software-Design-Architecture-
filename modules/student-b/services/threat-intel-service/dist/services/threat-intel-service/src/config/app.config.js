"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3002', 10),
    apiKeySecret: process.env.API_KEY_SECRET ?? 'dev-secret',
}));
//# sourceMappingURL=app.config.js.map