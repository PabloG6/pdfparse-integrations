import type { Schema as YupSchema } from 'yup';
import type { SchemaAdapter, SafeParseResult } from './base.js';
/**
 * Yup schema adapter
 */
export declare class YupAdapter<T extends YupSchema<any>> implements SchemaAdapter<T['__outputType']> {
    private schema;
    constructor(schema: T);
    parse(data: unknown): Promise<T['__outputType']>;
    safeParse(data: unknown): SafeParseResult<T['__outputType']>;
    validate(data: unknown): boolean;
}
/**
 * Create a Yup adapter from a Yup schema
 */
export declare function createYupAdapter<T extends YupSchema<any>>(schema: T): YupAdapter<T>;
/**
 * Type guard to check if a value is a Yup schema
 */
export declare function isYupSchema(value: unknown): value is YupSchema<any>;
