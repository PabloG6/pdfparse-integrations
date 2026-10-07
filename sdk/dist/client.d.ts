import { HttpClient } from './utils/fetch.js';
import { TablesResource } from './resources/tables.js';
import { DocumentsResource } from './resources/documents.js';
import { JobsResource } from './resources/jobs.js';
import { RowsResource } from './resources/rows.js';
import { ExtractionAttemptsResource } from './resources/extraction-attempts.js';
import { UploadsResource } from './resources/uploads.js';
import { WebhooksResource } from './resources/webhooks.js';
import { RoutingRulesResource } from './resources/routing-rules.js';
import { SqlResource } from './resources/sql.js';
import { SplittersResource } from './resources/splitters.js';
export interface ClientOptions {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export declare class Client {
    readonly tables: TablesResource;
    readonly documents: DocumentsResource;
    readonly jobs: JobsResource;
    readonly rows: RowsResource;
    readonly extractionAttempts: ExtractionAttemptsResource;
    readonly uploads: UploadsResource;
    readonly webhooks: WebhooksResource;
    readonly routingRules: RoutingRulesResource;
    readonly sql: SqlResource;
    readonly splitters: SplittersResource;
    private http;
    private baseUrl;
    constructor(apiKey: string, options?: ClientOptions);
    getBaseUrl(): string;
    getHttpClient(): HttpClient;
}
