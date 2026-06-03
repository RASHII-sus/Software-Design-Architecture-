"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseOrchestrationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const response_plan_entity_1 = require("./domain/entities/response-plan.entity");
const response_action_entity_1 = require("./domain/entities/response-action.entity");
const approval_request_entity_1 = require("./domain/entities/approval-request.entity");
const response_plan_repository_1 = require("./domain/repositories/response-plan.repository");
const response_action_repository_1 = require("./domain/repositories/response-action.repository");
const response_orchestration_controller_1 = require("./controllers/response-orchestration.controller");
const aggressive_containment_strategy_1 = require("./services/strategy/aggressive-containment.strategy");
const balanced_response_strategy_1 = require("./services/strategy/balanced-response.strategy");
const conservative_strategy_1 = require("./services/strategy/conservative.strategy");
const watch_and_wait_strategy_1 = require("./services/strategy/watch-and-wait.strategy");
const response_strategy_selector_1 = require("./services/strategy/response-strategy.selector");
const block_ip_action_1 = require("./services/executor/block-ip.action");
const isolate_endpoint_action_1 = require("./services/executor/isolate-endpoint.action");
const disable_user_action_1 = require("./services/executor/disable-user.action");
const quarantine_file_action_1 = require("./services/executor/quarantine-file.action");
const escalate_action_1 = require("./services/executor/escalate.action");
const response_action_factory_1 = require("./services/factory/response-action.factory");
const incident_response_facade_1 = require("./services/facade/incident-response.facade");
const approval_service_1 = require("./services/approval.service");
const response_orchestration_event_publisher_1 = require("./events/response-orchestration-event.publisher");
let ResponseOrchestrationModule = class ResponseOrchestrationModule {
};
exports.ResponseOrchestrationModule = ResponseOrchestrationModule;
exports.ResponseOrchestrationModule = ResponseOrchestrationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                response_plan_entity_1.ResponsePlanEntity,
                response_action_entity_1.ResponseActionEntity,
                approval_request_entity_1.ApprovalRequestEntity,
            ]),
            config_1.ConfigModule,
            axios_1.HttpModule,
        ],
        controllers: [response_orchestration_controller_1.ResponseOrchestrationController],
        providers: [
            response_plan_repository_1.ResponsePlanRepository,
            response_action_repository_1.ResponseActionRepository,
            aggressive_containment_strategy_1.AggressiveContainmentStrategy,
            balanced_response_strategy_1.BalancedResponseStrategy,
            conservative_strategy_1.ConservativeStrategy,
            watch_and_wait_strategy_1.WatchAndWaitStrategy,
            response_strategy_selector_1.ResponseStrategySelector,
            block_ip_action_1.BlockIPAction,
            isolate_endpoint_action_1.IsolateEndpointAction,
            disable_user_action_1.DisableUserAction,
            quarantine_file_action_1.QuarantineFileAction,
            escalate_action_1.EscalateAction,
            response_action_factory_1.ResponseActionFactory,
            approval_service_1.ApprovalService,
            response_orchestration_event_publisher_1.ResponseOrchestrationEventPublisher,
            incident_response_facade_1.IncidentResponseFacade,
        ],
        exports: [incident_response_facade_1.IncidentResponseFacade],
    })
], ResponseOrchestrationModule);
//# sourceMappingURL=response-orchestration.module.js.map