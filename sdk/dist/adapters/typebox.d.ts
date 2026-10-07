import type { TSchema, Static } from '@sinclair/typebox';
import type { SchemaAdapter, SafeParseResult } from './base.js';
/**
 * TypeBox schema adapter
 */
export declare class TypeBoxAdapter<T extends TSchema> implements SchemaAdapter<Static<T>> {
    private schema;
    constructor(schema: T);
    parse(data: unknown): Static<T>;
    safeParse(data: unknown): SafeParseResult<Static<T>>;
    validate(data: unknown): boolean;
}
/**
 * Create a TypeBox adapter from a TypeBox schema
 */
export declare function createTypeBoxAdapter<T extends TSchema>(schema: T): TypeBoxAdapter<T>;
/**
 * Type guard to check if a value is a TypeBox schema
 */
export declare function isTypeBoxSchema(value: unknown): value is TSchema;
