import type { HttpClient } from '../utils/fetch.js';
import type { CreateRowRequest, CreateRowResponse, QueryRowsRequest, QueryRowsResponse, RowRecord, UpdateRowResponse } from '../types.js';
export declare class RowsResource {
    private http;
    constructor(http: HttpClient);
    create(data: CreateRowRequest): Promise<CreateRowResponse>;
    list(tableId: string): Promise<QueryRowsResponse>;
    search(request: QueryRowsRequest): Promise<QueryRowsResponse>;
    update(rowId: string, values: RowRecord): Promise<UpdateRowResponse>;
    delete(rowId: string): Promise<void>;
}
