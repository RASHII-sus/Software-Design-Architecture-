"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'sdapro',
    password: process.env.POSTGRES_PASSWORD ?? 'sdapro_secret',
    name: process.env.POSTGRES_DB ?? 'sdapro',
}));
//# sourceMappingURL=database.config.js.map