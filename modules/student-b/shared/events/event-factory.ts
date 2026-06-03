// shared/events/event-factory.ts
// Utility to construct well-formed domain events

import { v4 as uuidv4 } from 'uuid';
import { BaseDomainEvent, DomainEvent } from './domain-events';

export function createDomainEvent<T extends DomainEvent>(
  eventType: T['eventType'],
  source: string,
  payload: T['payload'],
  options?: { correlationId?: string; causationId?: string },
): T {
  const base: BaseDomainEvent = {
    eventId: uuidv4(),
    eventType,
    occurredAt: new Date().toISOString(),
    version: '1.0',
    source,
    correlationId: options?.correlationId,
    causationId: options?.causationId,
  };

  return { ...base, payload } as T;
}
