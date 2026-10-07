import type { HttpClient } from '../utils/fetch.js';
import type { Table, CreateTableRequest, UpdateTableRequest, MutationOptions } from '../types.js';
export declare class TablesResource {
    private http;
    constructor(http: HttpClient);
    create(schema: CreateTableRequest, options?: MutationOptions): Promise<Table>;
    list(): Promise<Table[]>;
    get(tableIdOrSlug: string): Promise<Table>;
    update(tableIdOrSlug: string, schema: UpdateTableRequest): Promise<Table>;
    delete(tableIdOrSlug: string): Promise<void>;
}
