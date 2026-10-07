export declare function verifyWebhookSignature(params: {
    secret: string;
    payload: string;
    signatureHeader: string;
    toleranceSeconds?: number;
}): Promise<boolean>;
