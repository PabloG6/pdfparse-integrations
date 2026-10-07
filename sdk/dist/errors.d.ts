/**
 * Error codes from the API specification
 */
export type ErrorCode = 'unauthorized' | 'not_found' | 'schema_mismatch' | 'file_processing_error' | 'insufficient_tokens' | 'storage_limit_exceeded' | 'validation_error' | 'forbidden' | 'conflict' | 'workflow_error';
/**
 * API error response structure
 */
export interface ApiErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
        request_id?: string;
        details?: Record<string, unknown>;
    };
}
/**
 * Base API error class
 */
export declare class ApiError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    get requestId(): string | undefined;
    constructor(code: ErrorCode, message: string, statusCode: number, details?: Record<string, unknown>);
    /**
     * Create an ApiError from an API error response
     */
    static fromResponse(response: ApiErrorResponse, statusCode: number): ApiError;
    /**
     * Check if an error is an ApiError
     */
    static isApiError(error: unknown): error is ApiError;
}
/**
 * Unauthorized error (401)
 */
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Schema mismatch error (422)
 */
export declare class SchemaMismatchError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * File processing error (422)
 */
export declare class FileProcessingError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Insufficient tokens error (402)
 */
export declare class InsufficientTokensError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Storage limit exceeded error (413)
 */
export declare class StorageLimitExceededError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Forbidden error (403)
 */
export declare class ForbiddenError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Workflow error (500)
 */
export declare class WorkflowError extends ApiError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Map error code to error class
 */
export declare function createErrorFromCode(code: ErrorCode, message: string, statusCode: number, details?: Record<string, unknown>): ApiError;
