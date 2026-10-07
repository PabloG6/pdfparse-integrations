export type DecodedRowId = {
    tableId: string;
    documentRecordId: string;
};
export declare function encodeRowId(tableId: string, documentRecordId: string): string;
export declare function decodeRowId(rowId: string): DecodedRowId;
