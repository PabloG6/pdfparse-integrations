# PdfParse TypeScript SDK

Turn PDFs into structured records from Node.js. `pdfparse-sdk` provides a typed client for the [PdfParse](https://pdfparse.net) REST API: define extraction tables, upload documents, track asynchronous jobs, and read the saved rows.

Use it for invoices, receipts, bank statements, purchase orders, and other documents whose data needs to reach your application. The package supports ESM and CommonJS and includes TypeScript declarations.

**This is a client for the hosted PdfParse service.** It does not perform local OCR or extract text offline. You need a PdfParse account, a project API key, and available processing quota. See [pricing](https://pdfparse.net/pricing) and the [API documentation](https://pdfparse.net/docs).

## Install

Requires **Node.js 20 or later**.

```bash
npm install pdfparse-sdk
```

For CommonJS:

```js
const { Client } = require("pdfparse-sdk");
```

## Connect to your project

Create a project in [PdfParse](https://pdfparse.net), open that project's **API Keys** page, and create a project API key. Save it in a local `.env` file:

```dotenv
PDFPARSE_API_KEY=replace_with_your_project_api_key
```

Add `.env` to your application's `.gitignore`. Keep this key on your server; do not embed it in a frontend bundle. The key selects the project, so resource methods do not need a project ID.

```js
import { Client } from "pdfparse-sdk";

const client = new Client(process.env.PDFPARSE_API_KEY);
const tables = await client.tables.list();
console.log(tables.map(({ id, name, slug }) => ({ id, name, slug })));
```

The default REST base URL is `https://api.pdfparse.net/v1`. A project API key is different from MCP OAuth authorization; it cannot authenticate the remote MCP endpoint.

## Tutorial: extract one invoice and save JSON and CSV

This walkthrough creates an invoice table, uploads a PDF, starts an extraction job, checks the source document's status, and exports only that document's rows. It checks that subtotal plus tax equals total before writing CSV.

Use a synthetic invoice first. The npm package includes one in `examples/invoice.pdf`. Copy it into your working directory and compare the extracted values with the original. The schema below extracts invoice-level fields; it does not extract line items.

```bash
cp node_modules/pdfparse-sdk/examples/invoice.pdf invoice.pdf
```

The first run creates a table and processes the PDF using your plan quota. The script saves table, file, and job IDs beside the input. Rerunning with the **same, unchanged PDF** resumes that job instead of uploading it again. Use a different input path for a different document.

### 1. Save this as `extract-invoice.mjs`

```js
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { ApiError, Client } from "pdfparse-sdk";

async function main() {
  const input = process.argv[2];
  const apiKey = process.env.PDFPARSE_API_KEY;
  if (!input) throw new Error("Usage: node extract-invoice.mjs ./invoice.pdf");
  if (!apiKey) throw new Error("Set PDFPARSE_API_KEY in .env");

  const client = new Client(apiKey, { baseUrl: process.env.PDFPARSE_API_BASE });
  const statePath = `${input}.pdfparse.json`;
  let state;
  try {
    state = JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    state = { runId: randomUUID() };
  }
  const checkpoint = () => writeFile(statePath, JSON.stringify(state, null, 2));
  await checkpoint();

  const table = state.tableId
    ? await client.tables.get(state.tableId)
    : await client.tables.create({
        name: `sdk_invoices_${state.runId.replaceAll("-", "")}`,
        columns: [
          { name: "invoice_number", type: "text", nullable: true,
            prompt: "Invoice number exactly as printed; null if absent." },
          { name: "supplier", type: "text", nullable: true,
            prompt: "Supplier issuing the invoice." },
          { name: "currency", type: "text", nullable: true,
            prompt: "ISO currency code when explicit or unambiguous; otherwise null." },
          { name: "subtotal", type: "number", nullable: true,
            prompt: "Subtotal before tax, as a decimal amount." },
          { name: "tax", type: "number", nullable: true,
            prompt: "Total tax amount, not the tax rate; null if absent." },
          { name: "total", type: "number", nullable: true,
            prompt: "Invoice total including tax, not the balance due." },
        ],
      }, { idempotencyKey: `${state.runId}:table` });
  state.tableId = table.id;
  await checkpoint();

  if (!state.fileId) {
    const bytes = await readFile(input);
    if (!bytes.length) throw new Error("The PDF is empty");
    const upload = await client.uploads.upload(bytes, {
      filename: basename(input), tableSlug: table.slug, type: "application/pdf",
    });
    state.fileId = upload.fileId;
    await checkpoint();
  }

  if (!state.jobId) {
    const job = await client.jobs.create({
      tableSlug: table.slug, documentKeys: [state.fileId],
    }, { idempotencyKey: `${state.runId}:job` });
    state.jobId = job.id;
    await checkpoint();
  }
  console.log(`Table: ${table.id}; file: ${state.fileId}; job: ${state.jobId}`);

  const { job } = await client.jobs.waitForCompletion(state.jobId, {
    interval: 2_000, timeout: 15 * 60_000,
  });
  if (job.job_status !== "completed") {
    throw new Error(`Job ${job.id} failed; inspect the document's extraction attempts`);
  }
  const documents = await client.documents.list({ table_id: table.id });
  const document = documents.find((item) => item.document_record_id === state.fileId);
  if (!document || document.status !== "completed") {
    throw new Error("Source document is not completed; inspect it before exporting");
  }

  const rows = [];
  for (let page = 1; ; page++) {
    const result = await client.rows.search({
      table_id: table.id,
      filters: [{ column: "document_record_id", op: "eq", value: state.fileId }],
      page, pageSize: 100,
    });
    rows.push(...result.results);
    if (page >= result.pageCount) break;
  }
  await writeFile("invoice-review.json", JSON.stringify(rows, null, 2) + "\n");
  if (rows.length !== 1) throw new Error("Expected one invoice row; review the source");

  const cents = (value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("Missing or invalid amount; review invoice-review.json");
    }
    return Math.round(value * 100);
  };
  const invoice = rows[0];
  if (cents(invoice.subtotal) + cents(invoice.tax) !== cents(invoice.total)) {
    throw new Error("Subtotal + tax differs from total; review discounts, freight, and rounding");
  }

  const columns = ["invoice_number", "supplier", "currency", "subtotal", "tax", "total"];
  const csvCell = (value) => {
    let text = value == null ? "" : String(value);
    if (typeof value === "string" && /^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))]
    .join("\r\n") + "\r\n";
  await writeFile("invoices.csv", csv);
  console.log("Saved invoice-review.json and invoices.csv; compare them with the PDF.");
}

main().catch((error) => {
  if (error instanceof ApiError) {
    console.error({ code: error.code, status: error.statusCode,
      requestId: error.requestId, message: error.message });
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
```

### 2. Run it

The identical script is included in the installed package. You can copy it instead of pasting the code:

```bash
cp node_modules/pdfparse-sdk/examples/extract-invoice.mjs extract-invoice.mjs
```

```bash
node --env-file=.env extract-invoice.mjs ./invoice.pdf
```

You should see the table, file, and job IDs, followed by a saved-files message. Successful processing produces:

| File | Purpose |
| --- | --- |
| `invoice.pdf.pdfparse.json` | Resume state: table, file, job, and operation IDs; no API key. |
| `invoice-review.json` | Extracted rows, written before amount validation so you can investigate failures. |
| `invoices.csv` | The six selected fields, exported after the basic amount check passes. |

### 3. Review the result

Compare the invoice number, supplier, currency, and amounts with the PDF. A completed job confirms processing finished; it does not establish that every field is accurate. Subtotal plus tax is a useful check for this sample, but invoices with freight, discounts, withholding, or unusual rounding need a different reconciliation rule.

The CSV helper quotes cells, escapes embedded quotes, and prefixes formula-like document text with an apostrophe for spreadsheet import. Extend your export policy for your destination system. Keep output files and resume state private if they contain business data.

If polling times out, rerun the same command with the unchanged input and state file. The script will continue checking the existing job. If a job failed, inspect its document and extraction attempts rather than repeatedly creating new jobs. Uploads are resumable through TUS, but a process crash before the upload checkpoint may leave an orphaned upload; this tutorial does not persist TUS resume URLs across processes.

## More ways to use the SDK

The following snippets build on the `client` and `table` created above. Adapt their schemas and prompts for your documents.

### Query and update extracted rows

```ts
const result = await client.rows.search({
  table_id: table.id,
  filters: [{ column: "currency", op: "eq", value: "USD" }],
  page: 1,
  pageSize: 50,
});

// Use the returned row_id, not an invoice number or the table's numeric id column.
const row = result.results[0];
if (row) await client.rows.update(row.row_id, { supplier: "Corrected supplier" });
```

`rows.search` returns `results`, `total`, `page`, `pageSize`, and `pageCount`. Paginate when you need all records. Each row's `row_id` is the canonical token for update and delete operations; `encodeRowId` and `decodeRowId` are available when you need to construct or inspect it.

### Keep repeating items in child tables

```ts
const itemTable = await client.tables.create({
  name: "invoices_with_items",
  columns: [
    { name: "invoice_number", type: "text", prompt: "Invoice number" },
  ],
  childTables: [{
    name: "invoice_items",
    columns: [
      { name: "description", type: "text", prompt: "Item description" },
      { name: "quantity", type: "number", prompt: "Quantity of this item" },
      { name: "line_total", type: "number", prompt: "Printed line total before tax" },
    ],
  }],
});
```

Child tables keep repeating line items queryable as rows. The parent and child tables can be read separately after extraction. See [the invoice API tutorial](https://pdfparse.net/blog/parse-invoice-pdfs-api-typescript) for a fuller workflow and reconciliation approach.

### Query saved tables with SQL

```ts
// Quote the actual table name returned by your authenticated project.
const tableName = table.name.replaceAll('"', '""');
const result = await client.sql.query<{ currency: string; amount: number }>(
  `SELECT currency, SUM(total) AS amount FROM "${tableName}" GROUP BY currency`,
);
console.table(result.rows);
```

This query uses the invoice table's `currency` and `total` columns. Queries allow one read-only SQLite statement and at most 100 returned rows. SQL strings, Drizzle query builders with `toSQL()`, and compiled Kysely queries are supported; builder parameters are transmitted separately.

### Route incoming PDFs automatically

```ts
await client.routingRules.create({
  name: "Invoice routing",
  prompt: "An invoice containing a supplier, invoice number, and total",
  tableId: table.id,
  confidenceThreshold: 70,
});

// Omit tableSlug to let the project's routing configuration choose a destination.
await client.uploads.upload(pdfBytes, { filename: "incoming-invoice.pdf" });
```

`pdfBytes` is a `Uint8Array` or a browser `File`/`Blob`. Unlike the explicit-table tutorial, this path uses automatic routing. Review unclassified documents with `client.documents.list({ status: "unclassified" })` and resolve one with `client.documents.route(document.id, table.id)`.

## Resources and helpers

| Resource | Operations |
| --- | --- |
| `client.tables` | Create, list, get, update, and delete extraction tables. |
| `client.uploads` | Upload `File`, `Blob`, `Uint8Array`, or Node.js `Buffer` bytes through TUS. |
| `client.jobs` | Create, get, and wait for asynchronous extraction jobs. |
| `client.documents` | List, get, and route source documents. |
| `client.rows` | Create, list, search, update, and delete records. |
| `client.extractionAttempts` | Inspect attempts for a document and failed attempts for a table. |
| `client.sql` | Query saved tables with read-only SQL. |
| `client.routingRules` | Create, list, get, update, and delete routing rules. |
| `client.splitters` | Create, list, get, update, test, publish, run, and delete page-range splitter configurations. |
| `client.webhooks` | Create, list, update, delete endpoints, and list deliveries. |

Exports also include typed request/response interfaces, schema adapters for Zod, Valibot, Yup, and TypeBox, row-ID helpers, polling utilities, API error classes, and an OAuth-oriented `McpClient`. The `McpClient` requires an existing authorized access token; it does not turn a project key into an OAuth token.

## Errors, retries, and timeouts

`Client` accepts `baseUrl`, `timeout` (per-request milliseconds), `retries`, and `retryDelay`. Defaults are a 30-second request timeout, three retries for eligible requests, and a 1-second initial retry delay with exponential backoff. Polling has a separate timeout.

POST and PATCH requests are not automatically retried unless they have an idempotency key. `tables.create(schema, { idempotencyKey })` and `jobs.create(config, { idempotencyKey })` support this header. Reuse the same key and body only when retrying the same operation within the API's retention window.

`jobs.waitForCompletion` returns `{ job }` for both `completed` and `failed` terminal states. Check `job.job_status` before reading or exporting records. `ApiError` exposes `code`, `statusCode`, `message`, and `requestId` for troubleshooting.

| Symptom | What to check |
| --- | --- |
| `401` / `unauthorized` | Project key is present, current, and sent to the REST API, rather than the MCP endpoint. |
| `403` / `forbidden` | Key and account have the required access to the project's resources. |
| Quota or storage error | Review the project's plan and usage before retrying. |
| Polling timeout | Inspect the existing job; a timeout does not cancel server-side work. |
| Completed job with failed/missing document or rows | Inspect source-document status and extraction attempts, then review the PDF. |
| Empty amount or mismatched total | Check the source, schema prompts, discounts, freight, and rounding. |

For a development endpoint, set `PDFPARSE_API_BASE` or pass `baseUrl` to `Client`. Leave it unset to use the hosted production API.

## Documentation and support

- [API documentation](https://pdfparse.net/docs)
- [MCP connection guide](https://pdfparse.net/docs/mcp)
- [Source and releases](https://github.com/PabloG6/pdfparse-integrations)
- [Report an SDK issue](https://github.com/PabloG6/pdfparse-integrations/issues)
- [Contact PdfParse](https://pdfparse.net/contact)

Licensed under [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0). The hosted service has separate [terms](https://pdfparse.net/terms-and-conditions).
