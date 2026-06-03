import { Repository } from 'typeorm';
import { ResponseActionEntity } from '../entities/response-action.entity';
import { ResponseActionStatus } from '../../../../../shared/contracts/enums';
export declare class ResponseActionRepository {
    private readonly repo;
    constructor(repo: Repository<ResponseActionEntity>);
    create(data: Partial<ResponseActionEntity>): Promise<ResponseActionEntity>;
    findById(id: string): Promise<ResponseActionEntity | null>;
    updateStatus(id: string, status: ResponseActionStatus, extras?: Partial<ResponseActionEntity>): Promise<void>;
    markExecuting(id: string): Promise<void>;
    markCompleted(id: string, success: boolean, outcome: Record<string, unknown>, rollbackContext?: Record<string, unknown>): Promise<void>;
    findByPlanId(responsePlanId: string): Promise<ResponseActionEntity[]>;
    findPendingApprovals(): Promise<ResponseActionEntity[]>;
}
