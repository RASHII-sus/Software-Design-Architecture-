"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('rabbitmq', () => ({
    url: process.env.RABBITMQ_URL ?? 'amqp://sdapro:rabbitmq_secret@localhost:5672/sdapro',
}));
//# sourceMappingURL=rabbitmq.config.js.map