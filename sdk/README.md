# pdfparse-sdk

TypeScript SDK for the flattened OCR Agent API contract.

## Installation

`pnpm --filter pdfparse-sdk run package:public` builds a distributable `pdfparse-sdk` package at `dist/public`, with ESM, CommonJS, and TypeScript declarations. Public tarballs are released from [PdfParse integrations](https://github.com/PabloG6/pdfparse-integrations/releases). The workspace package remains private to preserve internal imports. npm publication requires an authenticated publisher and is not implied by building or releasing the tarball.

Install the release tarball from https://github.com/PabloG6/pdfparse-integrations/releases. The npm listing is pending publisher authentication; do not assume it is published yet.

## Quick Start

```ts
import { Client, encodeRowId } from "pdfparse-sdk";

const client = new Client("your-api-key", {
  baseUrl: "https://api.pdfparse.net/v1",
});

const table = await client.tables.create({
  name: "invoice_rows",
  columns: [
    { name: "invoice_number", prompt: "Invoice number", type: "text" },
    { name: "total_amount", prompt: "Total amount", type: "number" },
  ],
});

const rows = await client.rows.search({
  table_id: table.id,
  filters: [{ column: "status", op: "eq", value: "ready" }],
  page: 1,
  pageSize: 50,
});

const job = await client.jobs.create({
  tableSlug: table.slug,
  documentKeys: ["file_1", "file_2"],
});

await client.rows.update(
  encodeRowId(table.id, "file_1"),
  { status: "approved" },
);
```

## Routing rules

Routing rules send newly uploaded documents to the matching destination table.
Project scope is inferred from the API key.

```ts
const rule = await client.routingRules.create({
  name: "Invoice routing",
  prompt: "Invoices containing a vendor, invoice number, and total",
  confidenceThreshold: 70,
  tableId: table.id,
});

await client.routingRules.update(rule.id, { enabled: false });

// Omitting tableSlug lets the routing workflow select a destination.
await client.uploads.upload(pdfBytes, { filename: "incoming-document.pdf" });

const [needsReview] = await client.documents.list({ status: "unclassified" });
if (needsReview) {
  await client.documents.route(needsReview.id, table.id);
}
```

## Read-only SQL

Use `client.sql.query<Row>()` when an article or integration needs joined,
aggregated, or otherwise presentation-ready data instead of a CSV or SQLite
download. Queries are restricted to one read-only statement and at most 100
returned rows.

```ts
type InvoiceSummary = {
  vendor: string;
  invoice_count: number;
  total_amount: number;
};

const result = await client.sql.query<InvoiceSummary>(
  `SELECT vendor,
          COUNT(*) AS invoice_count,
          SUM(total_amount) AS total_amount
     FROM invoice_rows
    GROUP BY vendor
    ORDER BY total_amount DESC`,
);

console.table(result.rows);
```

Drizzle query builders and compiled Kysely queries can be passed directly.
Their bound parameters are sent separately from the SQL text.

```ts
const drizzleResult = await client.sql.query(
  db.select().from(invoices).where(gt(invoices.totalAmount, 100)),
);

const kyselyResult = await client.sql.query(
  db.selectFrom("invoices").selectAll().where("total_amount", ">", 100).compile(),
);
```

## Page-range splitters

Create a draft with one-indexed inclusive page ranges, preview it against a page
count, publish an immutable version, and run that version against a stored
document. Every section must point to an existing table in the API key's
project.

```ts
const splitter = await client.splitters.create({
  name: "Purchase order packet",
  config: {
    overlap_policy: "exclusive",
    unassigned_policy: "review",
    sections: [
      {
        section_key: "purchase_order",
        name: "Purchase order",
        destination_table_id: purchaseOrders.id,
        page_spans: [{ start_page: 1, end_page: 2 }],
      },
      {
        section_key: "terms",
        name: "Terms",
        destination_table_id: contractTerms.id,
        page_spans: [{ start_page: 4, end_page: 6 }],
      },
    ],
  },
});

const preview = await client.splitters.test(splitter.id, 6);
// Page 3 is reported for review before anything is persisted.

const published = await client.splitters.publish(
  splitter.id,
  splitter.draft_revision,
);
const run = await client.splitters.run(splitter.id, document.id, {
  version: published.version,
});
```

`run.status` is `waiting_for_review` when the published configuration leaves
pages unassigned under the `review` policy. Otherwise the run contains immutable
segments and queued destination work items ready for segment extraction.

## Public Surface

- `client.tables.create/list/get/update/delete`
- `client.rows.create/list/search/update/delete`
- `client.documents.list/get/route`
- `client.jobs.create/get`
- `client.routingRules.create/list/get/update/delete`
- `client.splitters.create/list/get/update/publish/test/run/delete`
- `client.sql.query`
- `encodeRowId(tableId, documentRecordId)`
- `decodeRowId(rowId)`

## Notes

- Project scope is inferred from the API key. SDK methods do not accept `projectId` or `projectSlug`.
- `client.tables.get(...)` accepts either a table ID or slug because the API does.
- Row update/delete calls require the composite `row_id` token `table_id:document_record_id`.
- `client.jobs.waitForCompletion(jobId)` is still available and polls `GET /jobs/:job_id`.

## Article workflow options

`tables.create(schema, { idempotencyKey })` and `jobs.create(config, { idempotencyKey })` pass `Idempotency-Key` to the API. Reuse the key and body for retries within the API retention window. `jobs.waitForCompletion` returns for both completed and failed jobs; inspect `job.job_status`. `ApiError.requestId` carries the server correlation ID.

The three article examples and synthetic PDFs live under `apps/website/public/blog/api-examples`. Each includes an SDK runner and a direct REST runner with the same domain validation.
