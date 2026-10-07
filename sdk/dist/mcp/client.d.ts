import type { McpCallToolResult } from '../types.js';
export interface McpClientOptions {
    accessToken: string;
    baseUrl: string;
}
export declare class McpClient {
    private accessToken;
    private baseUrl;
    constructor(options: McpClientOptions);
    callTool(name: string, argumentsPayload: Record<string, unknown>): Promise<McpCallToolResult>;
}
