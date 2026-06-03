import { Repository } from 'typeorm';
import { ApprovalRequestEntity } from '../domain/entities/approval-request.entity';
import { ResponseActionRepository } from '../domain/repositories/response-action.repository';
export declare class ApprovalService {
    private readonly approvalRepo;
    private readonly actionRepository;
    private readonly logger;
    constructor(approvalRepo: Repository<ApprovalRequestEntity>, actionRepository: ResponseActionRepository);
    requestApproval(responseActionId: string, requestedBy?: string): Promise<ApprovalRequestEntity>;
    approve(approvalId: string, decidedBy: string, reason?: string): Promise<ApprovalRequestEntity>;
    reject(approvalId: string, decidedBy: string, reason: string): Promise<ApprovalRequestEntity>;
    getPendingApprovals(): Promise<ApprovalRequestEntity[]>;
}
