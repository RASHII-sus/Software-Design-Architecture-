declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiKeySecret: string;
    threatIntelServiceUrl: string;
    requireApprovalForCritical: boolean;
    autoRollbackOnFailure: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiKeySecret: string;
    threatIntelServiceUrl: string;
    requireApprovalForCritical: boolean;
    autoRollbackOnFailure: boolean;
}>;
export default _default;
