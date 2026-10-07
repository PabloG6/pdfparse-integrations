import type { HttpClient } from "../utils/fetch.js";
import type { RowRecord, SqlParameter, SqlQueryInput, SqlQueryOptions, SqlQueryResult } from "../types.js";
export declare function compileSqlQuery(input: SqlQueryInput): {
    sql: string;
    params?: SqlParameter[];
};
export declare class SqlResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Run a single read-only SQLite query. Accepts SQL text, a Drizzle query
     * builder with `toSQL()`, or a Kysely compiled query.
     */
    query<Row extends RowRecord = RowRecord>(input: SqlQueryInput, options?: SqlQueryOptions): Promise<SqlQueryResult<Row>>;
}
