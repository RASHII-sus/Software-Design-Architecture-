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
const response_orchestration_module_1 = require("./response-orchestration.module");
const health_controller_1 = require("./controllers/health.controller");
const response_plan_entity_1 = require("./domain/entities/response-plan.entity");
const response_action_entity_1 = require("./domain/entities/response-action.entity");
const approval_request_entity_1 = require("./domain/entities/approval-request.entity");
const app_config_1 = require("./config/app.config");
const database_config_1 = require("./config/database.config");
const rabbitmq_config_1 = require("./config/rabbitmq.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default, rabbitmq_config_1.default],
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
                    entities: [response_plan_entity_1.ResponsePlanEntity, response_action_entity_1.ResponseActionEntity, approval_request_entity_1.ApprovalRequestEntity],
                    synchronize: false,
                    logging: config.get('app.nodeEnv') === 'development',
                }),
            }),
            axios_1.HttpModule,
            terminus_1.TerminusModule,
            response_orchestration_module_1.ResponseOrchestrationModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map