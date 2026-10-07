import type { HttpClient } from '../utils/fetch.js';
import type { TusUploader } from '../tus/uploader.js';
import type { UploadMetadata, UploadResult } from '../types.js';
export interface UploadProgress {
    bytesUploaded: number;
    bytesTotal: number;
}
export interface UploadOptions {
    onProgress?: (progress: UploadProgress) => void;
    chunkSize?: number;
}
export declare class UploadsResource {
    private _http;
    private tusUploader;
    private baseUrl;
    constructor(_http: HttpClient, tusUploader: TusUploader, baseUrl: string);
    upload(file: File | Blob | Uint8Array, metadata: UploadMetadata, options?: UploadOptions): Promise<UploadResult>;
}
