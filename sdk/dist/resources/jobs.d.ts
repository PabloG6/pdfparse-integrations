import type { HttpClient } from '../utils/fetch.js';
import type { CreateJobRequest, Job, PollOptions, MutationOptions } from '../types.js';
export declare class JobsResource {
    private http;
    constructor(http: HttpClient);
    private toJobShape;
    create(config: CreateJobRequest, options?: MutationOptions): Promise<Job>;
    get(jobId: number): Promise<Job>;
    waitForCompletion(jobId: number, options?: PollOptions): Promise<{
        job: Job;
    }>;
}
