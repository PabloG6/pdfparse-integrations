/**
 * TUS upload options
 */
export interface TusUploadOptions {
    endpoint: string;
    metadata: Record<string, string>;
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
    onError?: (error: Error) => void;
    onSuccess?: () => void;
    chunkSize?: number;
    retryDelays?: number[];
    headers?: Record<string, string>;
}
/**
 * TUS upload result
 */
export interface TusUploadResult {
    uploadId: string;
    url: string;
}
