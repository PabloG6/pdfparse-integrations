import type { BaseSchema, InferOutput } from 'valibot';
import type { SchemaAdapter, SafeParseResult } from './base.js';
/**
 * Valibot schema adapter
 */
export declare class ValibotAdapter<T extends BaseSchema<any, any, any>> implements SchemaAdapter<InferOutput<T>> {
    private schema;
    constructor(schema: T);
    parse(data: unknown): InferOutput<T>;
    safeParse(data: unknown): SafeParseResult<InferOutput<T>>;
    validate(data: unknown): boolean;
}
/**
 * Create a Valibot adapter from a Valibot schema
 */
export declare function createValibotAdapter<T extends BaseSchema<any, any, any>>(schema: T): ValibotAdapter<T>;
/**
 * Type guard to check if a value is a Valibot schema
 */
export declare function isValibotSchema(value: unknown): value is BaseSchema<any, any, any>;
