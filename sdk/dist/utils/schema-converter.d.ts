import type { ColumnSchema, TableSchema } from '../types.js';
import type { SchemaAdapter } from '../adapters/base.js';
/**
 * Convert a validation library schema to a SchemaAdapter
 */
export declare function toSchemaAdapter(schema: unknown): SchemaAdapter | null;
/**
 * Convert ColumnSchema to a basic object schema representation
 * This is a helper for documentation/type generation purposes
 */
export declare function columnSchemaToObject(column: ColumnSchema): Record<string, unknown>;
/**
 * Convert TableSchema to a basic object representation
 */
export declare function tableSchemaToObject(schema: TableSchema): Record<string, unknown>;
/**
 * Helper to create a basic Zod schema from ColumnSchema
 * Note: This is a simplified conversion - full conversion would require
 * more complex logic based on column types and constraints
 */
export declare function createZodSchemaFromColumns(columns: ColumnSchema[]): unknown;
/**
 * Helper to create a basic Valibot schema from ColumnSchema
 */
export declare function createValibotSchemaFromColumns(columns: ColumnSchema[]): unknown;
