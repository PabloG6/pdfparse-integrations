import type { PollOptions } from '../types.js';
/**
 * Polling result
 */
export interface PollResult<T> {
    data: T;
    cancelled: boolean;
}
/**
 * Poll a resource until a condition is met
 */
export declare function poll<T>(fetchFn: () => Promise<T>, checkFn: (data: T) => boolean, options?: PollOptions): Promise<T>;
/**
 * Poll until job is completed or failed
 */
export declare function pollJob<T extends {
    job_status?: string;
    status?: string;
}>(fetchFn: () => Promise<T>, options?: PollOptions): Promise<T>;
/**
 * Poll until document is ready
 */
export declare function pollDocument<T extends {
    status: string;
}>(fetchFn: () => Promise<T>, options?: PollOptions): Promise<T>;
/**
 * Create a cancellable poller
 */
export declare function createCancellablePoller<T>(fetchFn: () => Promise<T>, checkFn: (data: T) => boolean, options?: PollOptions): {
    poll: () => Promise<PollResult<T>>;
    cancel: () => void;
};
