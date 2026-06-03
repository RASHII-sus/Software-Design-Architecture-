import { Repository } from 'typeorm';
import { ResponsePlanEntity } from '../entities/response-plan.entity';
import { ResponsePlanStatus } from '../../../../../shared/contracts/enums';
export declare class ResponsePlanRepository {
    private readonly repo;
    constructor(repo: Repository<ResponsePlanEntity>);
    create(data: Partial<ResponsePlanEntity>): Promise<ResponsePlanEntity>;
    findById(id: string): Promise<ResponsePlanEntity | null>;
    findByIncidentId(incidentId: string): Promise<ResponsePlanEntity[]>;
    updateStatus(id: string, status: ResponsePlanStatus, completedAt?: Date): Promise<void>;
    findActivePlans(): Promise<ResponsePlanEntity[]>;
}
