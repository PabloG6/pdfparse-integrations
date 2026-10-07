import type { HttpClient } from '../utils/fetch.js';
import type { Document, DocumentListItem, DocumentFilters, PollOptions, DeleteDocumentResponse, MutationOptions, RouteDocumentResponse } from '../types.js';
export declare class DocumentsResource {
    private http;
    constructor(http: HttpClient);
    get(documentId: number): Promise<Document>;
    list(filters?: DocumentFilters): Promise<DocumentListItem[]>;
    delete(documentId: number): Promise<DeleteDocumentResponse>;
    route(documentId: number, tableId: string, options?: MutationOptions): Promise<RouteDocumentResponse>;
    waitForReady(documentId: number, options?: PollOptions): Promise<Document>;
}
