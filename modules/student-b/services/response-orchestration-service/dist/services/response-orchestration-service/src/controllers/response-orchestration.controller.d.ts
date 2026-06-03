import { IncidentResponseFacade } from '../services/facade/incident-response.facade';
import { ApprovalService } from '../services/approval.service';
import { AssessAndRespondDto } from '../dto/assess-and-respond.dto';
export declare class ResponseOrchestrationController {
    private readonly facade;
    private readonly approvalService;
    private readonly logger;
    constructor(facade: IncidentResponseFacade, approvalService: ApprovalService);
    assessAndRespond(dto: AssessAndRespondDto): Promise<import("../services/facade/incident-response.facade").AssessAndRespondResult>;
    getResponseHistory(incidentId: string): Promise<import("../domain/entities/response-plan.entity").ResponsePlanEntity[]>;
    rollbackPlan(planId: string): Promise<import("../services/facade/incident-response.facade").RollbackResult>;
    getPendingApprovals(): Promise<import("../domain/entities/approval-request.entity").ApprovalRequestEntity[]>;
    approveAction(approvalId: string, body: {
        decidedBy: string;
        reason?: string;
    }): Promise<import("../domain/entities/approval-request.entity").ApprovalRequestEntity>;
    rejectAction(approvalId: string, body: {
        decidedBy: string;
        reason: string;
    }): Promise<import("../domain/entities/approval-request.entity").ApprovalRequestEntity>;
    getMetrics(): Promise<any>;
    getStrategies(): {
        strategies: {
            name: string;
            description: string;
            useCase: string;
        }[];
    };
}
