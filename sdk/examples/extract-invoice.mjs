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
