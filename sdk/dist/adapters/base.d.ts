/**
 * Base interface for all validation library adapters
 */
export interface SchemaAdapter<T = unknown> {
    /**
     * Parse and validate data, throwing on error
     * Can be synchronous or asynchronous depending on the validation library
     */
    parse(data: unknown): T | Promise<T>;
    /**
     * Safely parse data without throwing
     * Can be synchronous or asynchronous depending on the validation library
     */
    safeParse(data: unknown): SafeParseResult<T> | Promise<SafeParseResult<T>>;
    /**
     * Validate data without parsing
     * Can be synchronous or asynchronous depending on the validation library
     */
    validate(data: unknown): boolean | Promise<boolean>;
}
/**
 * Result type for safe parsing operations
 */
export interface SafeParseResult<T> {
    success: boolean;
    data?: T;
    error?: ValidationError;
}
/**
 * Validation error with details
 */
export interface ValidationError {
    message: string;
    path?: (string | number)[];
    code?: string;
    issues?: Array<{
        message: string;
        path?: (string | number)[];
        code?: string;
    }>;
}
/**
 * Type guard to check if a value is a SchemaAdapter
 */
export declare function isSchemaAdapter(value: unknown): value is SchemaAdapter;
