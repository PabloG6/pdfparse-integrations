import type { HttpClient } from '../utils/fetch.js';
import type { ExtractionAttempt, FailedExtractionAttempt } from '../types.js';
/**
 * Extraction attempts resource
 */
export declare class ExtractionAttemptsResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get extraction attempts for a document
     */
    getByDocument(documentId: number): Promise<ExtractionAttempt[]>;
    /**
     * List failed extraction attempts
     */
    listFailed(tableId: string, status?: string): Promise<FailedExtractionAttempt[]>;
}
