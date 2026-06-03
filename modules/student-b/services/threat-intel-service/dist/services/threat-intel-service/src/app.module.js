"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const terminus_1 = require("@nestjs/terminus");
const axios_1 = require("@nestjs/axios");
const threat_intel_module_1 = require("./threat-intel.module");
const health_controller_1 = require("./controllers/health.controller");
const threat_indicator_entity_1 = require("./domain/entities/threat-indicator.entity");
const app_config_1 = require("./config/app.config");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
const rabbitmq_config_1 = require("./config/rabbitmq.config");
const external_apis_config_1 = require("./config/external-apis.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default, redis_config_1.default, rabbitmq_config_1.default, external_apis_config_1.default],
                envFilePath: ['.env', '.env.local'],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('database.host'),
                    port: config.get('database.port'),
                    username: config.get('database.username'),
                    password: config.get('database.password'),
                    database: config.get('database.name'),
                    entities: [threat_indicator_entity_1.ThreatIndicatorEntity],
                    synchronize: false,
                    logging: config.get('app.nodeEnv') === 'development',
                    ssl: config.get('app.nodeEnv') === 'production'
                        ? { rejectUnauthorized: false }
                        : false,
                }),
            }),
            axios_1.HttpModule,
            terminus_1.TerminusModule,
            threat_intel_module_1.ThreatIntelModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map