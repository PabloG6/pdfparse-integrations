import type { HttpClient } from "../utils/fetch.js";
import type { CreateRoutingRuleRequest, MutationOptions, RoutingRule, UpdateRoutingRuleRequest } from "../types.js";
export declare class RoutingRulesResource {
    private http;
    constructor(http: HttpClient);
    create(request: CreateRoutingRuleRequest, options?: MutationOptions): Promise<RoutingRule>;
    list(): Promise<RoutingRule[]>;
    get(id: string): Promise<RoutingRule>;
    update(id: string, request: UpdateRoutingRuleRequest, options?: MutationOptions): Promise<RoutingRule>;
    delete(id: string, options?: MutationOptions): Promise<void>;
}
