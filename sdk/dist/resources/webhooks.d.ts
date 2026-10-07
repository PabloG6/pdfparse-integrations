import type { HttpClient } from '../utils/fetch.js';
import type { CreateWebhookEndpointRequest, CreateWebhookEndpointResponse, UpdateWebhookEndpointRequest, WebhookDelivery, WebhookEndpoint } from '../types.js';
export declare class WebhooksResource {
    private http;
    constructor(http: HttpClient);
    create(request: CreateWebhookEndpointRequest): Promise<CreateWebhookEndpointResponse>;
    list(): Promise<WebhookEndpoint[]>;
    update(endpointId: string, request: UpdateWebhookEndpointRequest): Promise<WebhookEndpoint>;
    listDeliveries(endpointId: string): Promise<WebhookDelivery[]>;
    delete(endpointId: string): Promise<void>;
}
