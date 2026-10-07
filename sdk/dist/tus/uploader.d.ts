import { Upload } from 'tus-js-client';
import type { TusUploadOptions, TusUploadResult } from './types.js';
export declare function extractUploadId(url: string): string;
/**
 * TUS uploader wrapper
 */
export declare class TusUploader {
    /**
     * Upload a file using TUS protocol
     */
    upload(file: File | Blob | Uint8Array, options: TusUploadOptions): Promise<TusUploadResult>;
    /**
     * Create a new upload instance (for advanced usage)
     */
    createUpload(file: File | Blob | Uint8Array, options: TusUploadOptions): Upload;
}
