"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const response_action_factory_1 = require("../../src/services/factory/response-action.factory");
const block_ip_action_1 = require("../../src/services/executor/block-ip.action");
const isolate_endpoint_action_1 = require("../../src/services/executor/isolate-endpoint.action");
const disable_user_action_1 = require("../../src/services/executor/disable-user.action");
const quarantine_file_action_1 = require("../../src/services/executor/quarantine-file.action");
const escalate_action_1 = require("../../src/services/executor/escalate.action");
const enums_1 = require("../../../../shared/contracts/enums");
describe('ResponseActionFactory', () => {
    let factory;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                response_action_factory_1.ResponseActionFactory,
                block_ip_action_1.BlockIPAction,
                isolate_endpoint_action_1.IsolateEndpointAction,
                disable_user_action_1.DisableUserAction,
                quarantine_file_action_1.QuarantineFileAction,
                escalate_action_1.EscalateAction,
            ],
        }).compile();
        factory = module.get(response_action_factory_1.ResponseActionFactory);
    });
    describe('createAction', () => {
        it('returns BlockIPAction for BLOCK_IP type', () => {
            const action = factory.createAction(enums_1.ResponseActionType.BLOCK_IP);
            expect(action.getType()).toBe(enums_1.ResponseActionType.BLOCK_IP);
            expect(action).toBeInstanceOf(block_ip_action_1.BlockIPAction);
        });
        it('returns IsolateEndpointAction for ISOLATE_ENDPOINT type', () => {
            const action = factory.createAction(enums_1.ResponseActionType.ISOLATE_ENDPOINT);
            expect(action.getType()).toBe(enums_1.ResponseActionType.ISOLATE_ENDPOINT);
            expect(action).toBeInstanceOf(isolate_endpoint_action_1.IsolateEndpointAction);
        });
        it('returns DisableUserAction for DISABLE_USER type', () => {
            const action = factory.createAction(enums_1.ResponseActionType.DISABLE_USER);
            expect(action.getType()).toBe(enums_1.ResponseActionType.DISABLE_USER);
            expect(action).toBeInstanceOf(disable_user_action_1.DisableUserAction);
        });
        it('returns QuarantineFileAction for QUARANTINE_FILE type', () => {
            const action = factory.createAction(enums_1.ResponseActionType.QUARANTINE_FILE);
            expect(action.getType()).toBe(enums_1.ResponseActionType.QUARANTINE_FILE);
            expect(action).toBeInstanceOf(quarantine_file_action_1.QuarantineFileAction);
        });
        it('returns EscalateAction for ESCALATE type', () => {
            const action = factory.createAction(enums_1.ResponseActionType.ESCALATE);
            expect(action.getType()).toBe(enums_1.ResponseActionType.ESCALATE);
            expect(action).toBeInstanceOf(escalate_action_1.EscalateAction);
        });
        it('throws error for unregistered action type', () => {
            expect(() => factory.createAction('UNKNOWN_TYPE')).toThrow(/No action registered for type/);
        });
    });
    describe('getSupportedTypes', () => {
        it('returns all five registered action types', () => {
            const types = factory.getSupportedTypes();
            expect(types).toHaveLength(5);
            expect(types).toContain(enums_1.ResponseActionType.BLOCK_IP);
            expect(types).toContain(enums_1.ResponseActionType.ISOLATE_ENDPOINT);
            expect(types).toContain(enums_1.ResponseActionType.DISABLE_USER);
            expect(types).toContain(enums_1.ResponseActionType.QUARANTINE_FILE);
            expect(types).toContain(enums_1.ResponseActionType.ESCALATE);
        });
    });
    describe('isSupported', () => {
        it('returns true for registered types', () => {
            expect(factory.isSupported(enums_1.ResponseActionType.BLOCK_IP)).toBe(true);
        });
        it('returns false for unregistered types', () => {
            expect(factory.isSupported('NUKE_DATACENTER')).toBe(false);
        });
    });
    describe('concrete action behaviours', () => {
        it('BlockIPAction is reversible', () => {
            const action = factory.createAction(enums_1.ResponseActionType.BLOCK_IP);
            expect(action.isReversible()).toBe(true);
        });
        it('EscalateAction is NOT reversible', () => {
            const action = factory.createAction(enums_1.ResponseActionType.ESCALATE);
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
//# sourceMappingURL=response-action.factory.spec.js.map