// services/response-orchestration-service/src/controllers/response-orchestration.controller.ts

import {
  Controller, Post, Get, Delete, Body, Param,
  HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { IncidentResponseFacade } from '../services/facade/incident-response.facade';
import { ApprovalService } from '../services/approval.service';
import { AssessAndRespondDto } from '../dto/assess-and-respond.dto';
import { MetricsDecorator } from '../services/decorator/metrics.decorator';
import { IncidentState } from '../../../../shared/contracts/enums';

@ApiTags('response-orchestration')
@ApiSecurity('api-key')
@Controller('response')
export class ResponseOrchestrationController {
  private readonly logger = new Logger(ResponseOrchestrationController.name);

  constructor(
    private readonly facade: IncidentResponseFacade,
    private readonly approvalService: ApprovalService,
  ) {}

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assess incident and execute automated response plan' })
  @ApiResponse({ status: 200, description: 'Response plan executed and outcomes returned' })
  async assessAndRespond(@Body() dto: AssessAndRespondDto) {
    this.logger.log(`POST /response/assess — incidentId=${dto.incidentId}`);

    const context = {
      incidentId: dto.incidentId,
      incidentState: dto.incidentState ?? IncidentState.CONTAINMENT,
      severity: dto.severity,
      assetCriticality: dto.assetCriticality,
      analystId: dto.analystId,
      autoResponse: dto.autoResponse ?? true,
      businessContext: dto.businessContext,
    };

    return this.facade.assessAndRespond(dto.incidentId, context, dto.targetAssets);
  }

  @Get('incidents/:incidentId/history')
  @ApiOperation({ summary: 'Get response plan history for an incident' })
  async getResponseHistory(@Param('incidentId') incidentId: string) {
    return this.facade.getResponseHistory(incidentId);
  }

  @Post('plans/:planId/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback all actions in a response plan' })
  async rollbackPlan(@Param('planId') planId: string) {
    this.logger.log(`POST /response/plans/${planId}/rollback`);
    return this.facade.rollbackPlan(planId);
  }

  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get all pending approval requests' })
  async getPendingApprovals() {
    return this.approvalService.getPendingApprovals();
  }

  @Post('approvals/:approvalId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending response action' })
  async approveAction(
    @Param('approvalId') approvalId: string,
    @Body() body: { decidedBy: string; reason?: string },
  ) {
    return this.approvalService.approve(approvalId, body.decidedBy, body.reason);
  }

  @Post('approvals/:approvalId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending response action' })
  async rejectAction(
    @Param('approvalId') approvalId: string,
    @Body() body: { decidedBy: string; reason: string },
  ) {
    return this.approvalService.reject(approvalId, body.decidedBy, body.reason);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get action execution metrics from MetricsDecorator' })
  async getMetrics(): Promise<any>{
  return MetricsDecorator.getMetrics();
}

  @Get('strategies')
  @ApiOperation({ summary: 'List all available response strategies' })
  getStrategies(
  ) {
    // Return strategies info from selector
    return {
      strategies: [
        {
          name: 'AggressiveContainmentStrategy',
          description: 'CRITICAL severity on HIGH/CRITICAL assets. Isolates, blocks, disables.',
          useCase: 'severity=CRITICAL, assetCriticality=CRITICAL|HIGH',
        },
        {
          name: 'BalancedResponseStrategy',
          description: 'HIGH severity. Blocks IPs and quarantines files. Preserves endpoint.',
          useCase: 'severity=HIGH, assetCriticality=MEDIUM|HIGH',
        },
        {
          name: 'ConservativeStrategy',
          description: 'MEDIUM severity. Only network block. Escalates for human decision.',
          useCase: 'severity=MEDIUM',
        },
        {
          name: 'WatchAndWaitStrategy',
          description: 'LOW/INFORMATIONAL. No automated actions. Escalates to analyst.',
          useCase: 'severity=LOW|INFORMATIONAL',
        },
      ],
    };
  }
}
