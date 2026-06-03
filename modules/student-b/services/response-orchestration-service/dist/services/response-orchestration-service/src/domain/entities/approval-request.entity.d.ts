import { ResponseActionEntity } from './response-action.entity';
export declare class ApprovalRequestEntity {
    id: string;
    responseActionId: string;
    responseAction: ResponseActionEntity;
    requestedBy: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reason: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
}
