import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';
export declare class BalancedResponseStrategy implements ResponseStrategy {
    getName(): string;
    getDescription(): string;
    determineActions(context: ResponseContext): ResponsePlan;
}
