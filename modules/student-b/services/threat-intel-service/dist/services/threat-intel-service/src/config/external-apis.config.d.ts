declare const _default: (() => {
    virusTotal: {
        apiKey: string;
        baseUrl: string;
        rateLimitPerMinute: number;
    };
    misp: {
        baseUrl: string;
        authKey: string;
        rateLimitPerMinute: number;
    };
    customFeed: {
        url: string;
        apiKey: string;
        rateLimitPerMinute: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    virusTotal: {
        apiKey: string;
        baseUrl: string;
        rateLimitPerMinute: number;
    };
    misp: {
        baseUrl: string;
        authKey: string;
        rateLimitPerMinute: number;
    };
    customFeed: {
        url: string;
        apiKey: string;
        rateLimitPerMinute: number;
    };
}>;
export default _default;
