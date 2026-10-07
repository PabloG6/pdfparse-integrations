import type { HttpClient } from '../utils/fetch.js';
import type { Agent, AgentDetails, CreateAgentKeyRequest, CreateAgentKeyResponse, CreateAgentRequest, RouteScope, UpdateAgentRequest } from '../types.js';
export declare class AgentsResource {
    private http;
    constructor(http: HttpClient);
    create(data: CreateAgentRequest): Promise<Agent>;
    list(): Promise<Agent[]>;
    get(agentId: string): Promise<AgentDetails>;
    update(agentId: string, data: UpdateAgentRequest): Promise<Agent>;
    delete(agentId: string): Promise<void>;
    createKey(agentId: string, request?: CreateAgentKeyRequest): Promise<CreateAgentKeyResponse>;
    revokeKey(agentId: string, keyId: string): Promise<void>;
    setRoutePermissions(agentId: string, scopes: RouteScope[]): Promise<void>;
    setProjectPermission(agentId: string, projectId: string | number, enabled: boolean): Promise<void>;
}
