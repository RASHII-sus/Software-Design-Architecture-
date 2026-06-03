// services/response-orchestration-service/tests/unit/response-action.factory.spec.ts
// PATTERN: Factory Method — verify factory returns correct concrete product

import { Test, TestingModule } from '@nestjs/testing';
import { ResponseActionFactory } from '../../src/services/factory/response-action.factory';
import { BlockIPAction } from '../../src/services/executor/block-ip.action';
import { IsolateEndpointAction } from '../../src/services/executor/isolate-endpoint.action';
import { DisableUserAction } from '../../src/services/executor/disable-user.action';
import { QuarantineFileAction } from '../../src/services/executor/quarantine-file.action';
import { EscalateAction } from '../../src/services/executor/escalate.action';
import { ResponseActionType } from '../../../../shared/contracts/enums';

describe('ResponseActionFactory', () => {
  let factory: ResponseActionFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseActionFactory,
        BlockIPAction,
        IsolateEndpointAction,
        DisableUserAction,
        QuarantineFileAction,
        EscalateAction,
      ],
    }).compile();

    factory = module.get<ResponseActionFactory>(ResponseActionFactory);
  });

  describe('createAction', () => {
    it('returns BlockIPAction for BLOCK_IP type', () => {
      const action = factory.createAction(ResponseActionType.BLOCK_IP);
      expect(action.getType()).toBe(ResponseActionType.BLOCK_IP);
      expect(action).toBeInstanceOf(BlockIPAction);
    });

    it('returns IsolateEndpointAction for ISOLATE_ENDPOINT type', () => {
      const action = factory.createAction(ResponseActionType.ISOLATE_ENDPOINT);
      expect(action.getType()).toBe(ResponseActionType.ISOLATE_ENDPOINT);
      expect(action).toBeInstanceOf(IsolateEndpointAction);
    });

    it('returns DisableUserAction for DISABLE_USER type', () => {
      const action = factory.createAction(ResponseActionType.DISABLE_USER);
      expect(action.getType()).toBe(ResponseActionType.DISABLE_USER);
      expect(action).toBeInstanceOf(DisableUserAction);
    });

    it('returns QuarantineFileAction for QUARANTINE_FILE type', () => {
      const action = factory.createAction(ResponseActionType.QUARANTINE_FILE);
      expect(action.getType()).toBe(ResponseActionType.QUARANTINE_FILE);
      expect(action).toBeInstanceOf(QuarantineFileAction);
    });

    it('returns EscalateAction for ESCALATE type', () => {
      const action = factory.createAction(ResponseActionType.ESCALATE);
      expect(action.getType()).toBe(ResponseActionType.ESCALATE);
      expect(action).toBeInstanceOf(EscalateAction);
    });

    it('throws error for unregistered action type', () => {
      expect(() =>
        factory.createAction('UNKNOWN_TYPE' as ResponseActionType),
      ).toThrow(/No action registered for type/);
    });
  });

  describe('getSupportedTypes', () => {
    it('returns all five registered action types', () => {
      const types = factory.getSupportedTypes();
      expect(types).toHaveLength(5);
      expect(types).toContain(ResponseActionType.BLOCK_IP);
      expect(types).toContain(ResponseActionType.ISOLATE_ENDPOINT);
      expect(types).toContain(ResponseActionType.DISABLE_USER);
      expect(types).toContain(ResponseActionType.QUARANTINE_FILE);
      expect(types).toContain(ResponseActionType.ESCALATE);
    });
  });

  describe('isSupported', () => {
    it('returns true for registered types', () => {
      expect(factory.isSupported(ResponseActionType.BLOCK_IP)).toBe(true);
    });

    it('returns false for unregistered types', () => {
      expect(factory.isSupported('NUKE_DATACENTER' as ResponseActionType)).toBe(false);
    });
  });

  describe('concrete action behaviours', () => {
    it('BlockIPAction is reversible', () => {
      const action = factory.createAction(ResponseActionType.BLOCK_IP);
      expect(action.isReversible()).toBe(true);
    });

    it('EscalateAction is NOT reversible', () => {
      const action = factory.createAction(ResponseActionType.ESCALATE);
      expect(action.isReversible()).toBe(false);
    });

    it('all actions have a non-empty description', () => {
      for (const type of factory.getSupportedTypes()) {
        const action = factory.createAction(type);
        expect(action.describe()).toBeTruthy();
        expect(action.describe().length).toBeGreaterThan(5);
      }
    });
  });
});
