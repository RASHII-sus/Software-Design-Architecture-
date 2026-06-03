// services/response-orchestration-service/src/response-orchestration.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Entities
import { ResponsePlanEntity } from './domain/entities/response-plan.entity';
import { ResponseActionEntity } from './domain/entities/response-action.entity';
import { ApprovalRequestEntity } from './domain/entities/approval-request.entity';

// Repositories
import { ResponsePlanRepository } from './domain/repositories/response-plan.repository';
import { ResponseActionRepository } from './domain/repositories/response-action.repository';

// Controllers
import { ResponseOrchestrationController } from './controllers/response-orchestration.controller';

// Strategy implementations — PATTERN: Strategy
import { AggressiveContainmentStrategy } from './services/strategy/aggressive-containment.strategy';
import { BalancedResponseStrategy } from './services/strategy/balanced-response.strategy';
import { ConservativeStrategy } from './services/strategy/conservative.strategy';
import { WatchAndWaitStrategy } from './services/strategy/watch-and-wait.strategy';
import { ResponseStrategySelector } from './services/strategy/response-strategy.selector';

// Action implementations (concrete commands)
import { BlockIPAction } from './services/executor/block-ip.action';
import { IsolateEndpointAction } from './services/executor/isolate-endpoint.action';
import { DisableUserAction } from './services/executor/disable-user.action';
import { QuarantineFileAction } from './services/executor/quarantine-file.action';
import { EscalateAction } from './services/executor/escalate.action';

// Factory — PATTERN: Factory Method
import { ResponseActionFactory } from './services/factory/response-action.factory';

// Facade — PATTERN: Facade
import { IncidentResponseFacade } from './services/facade/incident-response.facade';

// Approval service
import { ApprovalService } from './services/approval.service';

// Event publisher
import { ResponseOrchestrationEventPublisher } from './events/response-orchestration-event.publisher';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResponsePlanEntity,
      ResponseActionEntity,
      ApprovalRequestEntity,
    ]),
    ConfigModule,
    HttpModule,
  ],
  controllers: [ResponseOrchestrationController],
  providers: [
    // Repositories
    ResponsePlanRepository,
    ResponseActionRepository,

    // PATTERN: Strategy — all strategy implementations
    AggressiveContainmentStrategy,
    BalancedResponseStrategy,
    ConservativeStrategy,
    WatchAndWaitStrategy,
    ResponseStrategySelector,

    // Concrete action implementations
    BlockIPAction,
    IsolateEndpointAction,
    DisableUserAction,
    QuarantineFileAction,
    EscalateAction,

    // PATTERN: Factory Method
    ResponseActionFactory,

    // Services
    ApprovalService,

    // Event publisher
    ResponseOrchestrationEventPublisher,

    // PATTERN: Facade — single entry point that wires everything together
    IncidentResponseFacade,
  ],
  exports: [IncidentResponseFacade],
})
export class ResponseOrchestrationModule {}
