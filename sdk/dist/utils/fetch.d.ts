/**
 * HTTP client options
 */
export interface HttpClientOptions {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
/**
 * Request options
 */
export interface RequestOptions extends RequestInit {
    timeout?: number;
    retries?: number;
}
/**
 * HTTP client for API requests
 */
export declare class HttpClient {
    private baseUrl;
    private apiKey;
    private defaultTimeout;
    private defaultRetries;
    private defaultRetryDelay;
    constructor(options: HttpClientOptions);
    getAuthorizationHeader(): string;
    /**
     * Make a GET request
     */
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make a POST request
     */
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a PUT request
     */
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a PATCH request
     */
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a DELETE request
     */
    delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
    /**
     * Make a request with retry logic
     */
    private request;
    /**
     * Handle error responses
     */
    private handleErrorResponse;
}
