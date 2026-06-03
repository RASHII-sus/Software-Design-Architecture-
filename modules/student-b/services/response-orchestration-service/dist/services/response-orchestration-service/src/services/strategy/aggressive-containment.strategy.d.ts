import { ResponseStrategy, ResponsePlan } from './response-strategy.interface';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';
export declare class AggressiveContainmentStrategy implements ResponseStrategy {
    getName(): string;
    getDescription(): string;
    determineActions(context: ResponseContext): ResponsePlan;
}
