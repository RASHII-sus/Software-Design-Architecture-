import { ResponseStrategy } from './response-strategy.interface';
import { AggressiveContainmentStrategy } from './aggressive-containment.strategy';
import { BalancedResponseStrategy } from './balanced-response.strategy';
import { ConservativeStrategy } from './conservative.strategy';
import { WatchAndWaitStrategy } from './watch-and-wait.strategy';
import { ResponseContext } from '../../../../../shared/contracts/interfaces';
export declare class ResponseStrategySelector {
    private readonly aggressive;
    private readonly balanced;
    private readonly conservative;
    private readonly watchAndWait;
    private readonly logger;
    constructor(aggressive: AggressiveContainmentStrategy, balanced: BalancedResponseStrategy, conservative: ConservativeStrategy, watchAndWait: WatchAndWaitStrategy);
    selectStrategy(context: ResponseContext): ResponseStrategy;
    private determineStrategy;
    getAllStrategies(): ResponseStrategy[];
}
