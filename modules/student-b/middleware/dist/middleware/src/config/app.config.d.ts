declare const _default: (() => {
    nodeEnv: string;
    port: number;
    threatIntelServiceUrl: string;
    apiKeySecret: string;
    deduplicationWindowSeconds: number;
    classificationDefaultSeverity: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    threatIntelServiceUrl: string;
    apiKeySecret: string;
    deduplicationWindowSeconds: number;
    classificationDefaultSeverity: string;
}>;
export default _default;
