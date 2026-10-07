import type { HttpClient } from "../utils/fetch.js";
import type { CreateSplitterRequest, MutationOptions, PublishSplitterResult, Splitter, SplitterDetail, SplitterPreview, SplitterRun, UpdateSplitterRequest } from "../types.js";
export declare class SplittersResource {
    private http;
    constructor(http: HttpClient);
    create(request: CreateSplitterRequest, options?: MutationOptions): Promise<Splitter>;
    list(): Promise<Splitter[]>;
    get(id: string): Promise<SplitterDetail>;
    update(id: string, request: UpdateSplitterRequest, options?: MutationOptions): Promise<Splitter>;
    publish(id: string, expectedDraftRevision: number, options?: MutationOptions): Promise<PublishSplitterResult>;
    test(id: string, pageCount: number, options?: {
        version?: number;
        idempotencyKey?: string;
    }): Promise<SplitterPreview>;
    run(id: string, documentId: number, options?: {
        version?: number;
        idempotencyKey?: string;
    }): Promise<SplitterRun>;
    delete(id: string, options?: MutationOptions): Promise<{
        success: true;
        archived: boolean;
    }>;
}
