// services/response-orchestration-service/src/services/factory/response-action.factory.ts
// PATTERN: Factory Method
// Centralizes creation of ResponseAction objects. Callers specify which
// ResponseActionType they need; the factory returns the correct implementation.
// Adding a new action type requires only registering it here — no changes
// to the Facade or Strategy layers.

import { Injectable, Logger } from '@nestjs/common';
import { ResponseAction } from '../executor/response-action.interface';
import { ResponseActionType } from '../../../../../shared/contracts/enums';
import { BlockIPAction } from '../executor/block-ip.action';
import { IsolateEndpointAction } from '../executor/isolate-endpoint.action';
import { DisableUserAction } from '../executor/disable-user.action';
import { QuarantineFileAction } from '../executor/quarantine-file.action';
import { EscalateAction } from '../executor/escalate.action';

// PATTERN: Factory Method — registry maps type → concrete implementation
type ActionRegistry = Map<ResponseActionType, ResponseAction>;

@Injectable()
export class ResponseActionFactory {
  private readonly logger = new Logger(ResponseActionFactory.name);
  private readonly registry: ActionRegistry;

  constructor(
    // All concrete actions injected by NestJS DI — factory does not new() them
    private readonly blockIPAction: BlockIPAction,
    private readonly isolateEndpointAction: IsolateEndpointAction,
    private readonly disableUserAction: DisableUserAction,
    private readonly quarantineFileAction: QuarantineFileAction,
    private readonly escalateAction: EscalateAction,
  ) {
    // PATTERN: Factory Method — populate the registry at construction time
    this.registry = new Map<ResponseActionType, ResponseAction>([
      [ResponseActionType.BLOCK_IP, this.blockIPAction],
      [ResponseActionType.ISOLATE_ENDPOINT, this.isolateEndpointAction],
      [ResponseActionType.DISABLE_USER, this.disableUserAction],
      [ResponseActionType.QUARANTINE_FILE, this.quarantineFileAction],
      [ResponseActionType.ESCALATE, this.escalateAction],
    ]);

    this.logger.log(
      `[ResponseActionFactory] Registered ${this.registry.size} action types: ` +
        Array.from(this.registry.keys()).join(', '),
    );
  }

  // PATTERN: Factory Method — creates the correct product by type key
  createAction(type: ResponseActionType): ResponseAction {
    const action = this.registry.get(type);

    if (!action) {
      throw new Error(
        `ResponseActionFactory: No action registered for type '${type}'. ` +
          `Registered types: ${Array.from(this.registry.keys()).join(', ')}`,
      );
    }

    this.logger.debug(`[ResponseActionFactory] Creating action: ${type} → ${action.describe()}`);
    return action;
  }

  getSupportedTypes(): ResponseActionType[] {
    return Array.from(this.registry.keys());
  }

  isSupported(type: ResponseActionType): boolean {
    return this.registry.has(type);
  }
}
