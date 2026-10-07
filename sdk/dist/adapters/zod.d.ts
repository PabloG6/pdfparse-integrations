import type { z } from 'zod';
import type { SchemaAdapter, SafeParseResult } from './base.js';
/**
 * Zod schema adapter
 */
export declare class ZodAdapter<T extends z.ZodTypeAny> implements SchemaAdapter<z.infer<T>> {
    private schema;
    constructor(schema: T);
    parse(data: unknown): z.infer<T>;
    safeParse(data: unknown): SafeParseResult<z.infer<T>>;
    validate(data: unknown): boolean;
}
/**
 * Create a Zod adapter from a Zod schema
 */
export declare function createZodAdapter<T extends z.ZodTypeAny>(schema: T): ZodAdapter<T>;
/**
 * Type guard to check if a value is a Zod schema
 */
export declare function isZodSchema(value: unknown): value is z.ZodTypeAny;
