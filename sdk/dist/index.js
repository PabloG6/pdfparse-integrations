var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/errors.ts
var ApiError = class _ApiError extends Error {
  get requestId() {
    return typeof this.details?.request_id === "string" ? this.details.request_id : void 0;
  }
  constructor(code, message, statusCode, details) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, _ApiError.prototype);
  }
  /**
   * Create an ApiError from an API error response
   */
  static fromResponse(response, statusCode) {
    const { code, message, details } = response.error;
    return new _ApiError(code, message, statusCode, {
      ...details,
      ...response.error.request_id ? { request_id: response.error.request_id } : {}
    });
  }
  /**
   * Check if an error is an ApiError
   */
  static isApiError(error) {
    return error instanceof _ApiError;
  }
};
var UnauthorizedError = class _UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", details) {
    super("unauthorized", message, 401, details);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, _UnauthorizedError.prototype);
  }
};
var NotFoundError = class _NotFoundError extends ApiError {
  constructor(message = "Resource not found", details) {
    super("not_found", message, 404, details);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, _NotFoundError.prototype);
  }
};
var ValidationError = class _ValidationError extends ApiError {
  constructor(message = "Validation failed", details) {
    super("validation_error", message, 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var SchemaMismatchError = class _SchemaMismatchError extends ApiError {
  constructor(message = "Schema mismatch", details) {
    super("schema_mismatch", message, 422, details);
    this.name = "SchemaMismatchError";
    Object.setPrototypeOf(this, _SchemaMismatchError.prototype);
  }
};
var FileProcessingError = class _FileProcessingError extends ApiError {
  constructor(message = "File processing error", details) {
    super("file_processing_error", message, 422, details);
    this.name = "FileProcessingError";
    Object.setPrototypeOf(this, _FileProcessingError.prototype);
  }
};
var InsufficientTokensError = class _InsufficientTokensError extends ApiError {
  constructor(message = "Insufficient tokens", details) {
    super("insufficient_tokens", message, 402, details);
    this.name = "InsufficientTokensError";
    Object.setPrototypeOf(this, _InsufficientTokensError.prototype);
  }
};
var StorageLimitExceededError = class _StorageLimitExceededError extends ApiError {
  constructor(message = "Storage limit exceeded", details) {
    super("storage_limit_exceeded", message, 413, details);
    this.name = "StorageLimitExceededError";
    Object.setPrototypeOf(this, _StorageLimitExceededError.prototype);
  }
};
var ForbiddenError = class _ForbiddenError extends ApiError {
  constructor(message = "Forbidden", details) {
    super("forbidden", message, 403, details);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, _ForbiddenError.prototype);
  }
};
var WorkflowError = class _WorkflowError extends ApiError {
  constructor(message = "Workflow error", details) {
    super("workflow_error", message, 500, details);
    this.name = "WorkflowError";
    Object.setPrototypeOf(this, _WorkflowError.prototype);
  }
};
function createErrorFromCode(code, message, statusCode, details) {
  switch (code) {
    case "unauthorized":
      return new UnauthorizedError(message, details);
    case "not_found":
      return new NotFoundError(message, details);
    case "validation_error":
      return new ValidationError(message, details);
    case "schema_mismatch":
      return new SchemaMismatchError(message, details);
    case "file_processing_error":
      return new FileProcessingError(message, details);
    case "insufficient_tokens":
      return new InsufficientTokensError(message, details);
    case "storage_limit_exceeded":
      return new StorageLimitExceededError(message, details);
    case "forbidden":
      return new ForbiddenError(message, details);
    case "conflict":
      return new ApiError(code, message, statusCode, details);
    case "workflow_error":
      return new WorkflowError(message, details);
    default:
      return new ApiError(code, message, statusCode, details);
  }
}

// src/utils/fetch.ts
var RETRYABLE_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);
var HttpClient = class {
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.defaultTimeout = options.timeout ?? 3e4;
    this.defaultRetries = options.retries ?? 3;
    this.defaultRetryDelay = options.retryDelay ?? 1e3;
  }
  getAuthorizationHeader() {
    return `Bearer ${this.apiKey}`;
  }
  /**
   * Make a GET request
   */
  async get(path, options) {
    return this.request(path, {
      ...options,
      method: "GET"
    });
  }
  /**
   * Make a POST request
   */
  async post(path, body, options) {
    return this.request(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a PUT request
   */
  async put(path, body, options) {
    return this.request(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a PATCH request
   */
  async patch(path, body, options) {
    return this.request(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a DELETE request
   */
  async delete(path, body, options) {
    return this.request(path, {
      ...options,
      method: "DELETE",
      body: body ? JSON.stringify(body) : void 0
    });
  }
  /**
   * Make a request with retry logic
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const timeout = options.timeout ?? this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;
    const retryDelay = this.defaultRetryDelay;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Content-Type", "application/json");
    const method = (options.method ?? "GET").toUpperCase();
    const canRetry = RETRYABLE_METHODS.has(method) || headers.has("Idempotency-Key");
    const maxAttempts = canRetry ? retries : 0;
    let lastError = null;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          return data;
        } else if (response.status === 204 || response.status === 201) {
          return void 0;
        } else {
          const text = await response.text();
          return text || void 0;
        }
      } catch (error) {
        lastError = error;
        if (error instanceof ApiError && (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404)) {
          throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        if (attempt < maxAttempts) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error("Request failed after retries");
  }
  /**
   * Handle error responses
   */
  async handleErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new ApiError(
        "workflow_error",
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        { request_id: response.headers.get("x-request-id") ?? void 0 }
      );
    }
    if (errorData.error) {
      throw createErrorFromCode(
        errorData.error.code,
        errorData.error.message,
        response.status,
        {
          ...errorData.error.details,
          request_id: errorData.error.request_id ?? response.headers.get("x-request-id") ?? void 0
        }
      );
    }
    throw new ApiError(
      "workflow_error",
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      { request_id: response.headers.get("x-request-id") ?? void 0 }
    );
  }
};

// src/resources/tables.ts
var TablesResource = class {
  constructor(http) {
    this.http = http;
  }
  async create(schema, options = {}) {
    const response = await this.http.post(
      "/tables",
      schema,
      ...options.idempotencyKey ? [{ headers: { "Idempotency-Key": options.idempotencyKey } }] : []
    );
    return this.get(response.id);
  }
  async list() {
    return this.http.get("/tables");
  }
  async get(tableIdOrSlug) {
    return this.http.get(`/tables/${tableIdOrSlug}`);
  }
  async update(tableIdOrSlug, schema) {
    return this.http.patch(`/tables/${tableIdOrSlug}`, schema);
  }
  async delete(tableIdOrSlug) {
    await this.http.delete(`/tables/${tableIdOrSlug}`);
  }
};

// src/utils/polling.ts
async function poll(fetchFn, checkFn, options = {}) {
  const interval = options.interval ?? 2e3;
  const timeout = options.timeout ?? 3e5;
  const startTime = Date.now();
  let lastData = null;
  while (true) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Polling timeout after ${timeout}ms`);
    }
    try {
      const data = await fetchFn();
      lastData = data;
      if (options.onProgress) {
        const status = data.status || data.job_status || "unknown";
        options.onProgress(status);
      }
      if (checkFn(data)) {
        return data;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      if (error instanceof Error && !error.message.includes("timeout")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
async function pollJob(fetchFn, options = {}) {
  return poll(
    fetchFn,
    (data) => {
      const status = data.job_status || data.status;
      return status === "completed" || status === "failed";
    },
    options
  );
}
async function pollDocument(fetchFn, options = {}) {
  return poll(
    fetchFn,
    (data) => {
      return data.status === "completed" || data.status === "failed" || data.status === "error";
    },
    options
  );
}
function createCancellablePoller(fetchFn, checkFn, options = {}) {
  let cancelled = false;
  let timeoutId = null;
  const cancel = () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
  const poll2 = async () => {
    const interval = options.interval ?? 2e3;
    const timeout = options.timeout ?? 3e5;
    const startTime = Date.now();
    while (!cancelled) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Polling timeout after ${timeout}ms`);
      }
      try {
        const data2 = await fetchFn();
        if (options.onProgress) {
          const status = data2.status || data2.job_status || "unknown";
          options.onProgress(status);
        }
        if (checkFn(data2)) {
          return { data: data2, cancelled: false };
        }
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, interval);
        });
      } catch (error) {
        if (error instanceof Error && !error.message.includes("timeout")) {
          throw error;
        }
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, interval);
        });
      }
    }
    const data = await fetchFn();
    return { data, cancelled: true };
  };
  return { poll: poll2, cancel };
}

// src/resources/documents.ts
var DocumentsResource = class {
  constructor(http) {
    this.http = http;
  }
  async get(documentId) {
    return this.http.get(`/documents/${documentId}`);
  }
  async list(filters) {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append("status", filters.status);
    }
    if (filters?.table_id) {
      params.append("table_id", filters.table_id);
    }
    const query = params.toString();
    const path = `/documents${query ? `?${query}` : ""}`;
    return this.http.get(path);
  }
  async delete(documentId) {
    return this.http.delete(`/documents/${documentId}`);
  }
  async route(documentId, tableId, options = {}) {
    return this.http.post(
      `/documents/${documentId}/route`,
      { tableId },
      options.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : void 0
    );
  }
  async waitForReady(documentId, options) {
    return pollDocument(() => this.get(documentId), options);
  }
};

// src/resources/jobs.ts
var JobsResource = class {
  constructor(http) {
    this.http = http;
  }
  toJobShape(response) {
    return {
      id: response.id,
      projects_id: response.projects_id,
      table_id: response.table_id,
      workflow_type: response.workflow_type ?? null,
      job_status: response.status,
      created_at: response.created_at,
      updated_at: response.updated_at,
      batches: response.batches
    };
  }
  async create(config, options = {}) {
    const response = await this.http.post("/jobs", config, ...options.idempotencyKey ? [{ headers: { "Idempotency-Key": options.idempotencyKey } }] : []);
    return this.toJobShape(response);
  }
  async get(jobId) {
    const response = await this.http.get(`/jobs/${jobId}`);
    return this.toJobShape(response);
  }
  async waitForCompletion(jobId, options = {}) {
    const job = await pollJob(() => this.get(jobId), options);
    return { job };
  }
};

// src/resources/rows.ts
var RowsResource = class {
  constructor(http) {
    this.http = http;
  }
  async create(data) {
    return this.http.post("/rows", data);
  }
  async list(tableId) {
    return this.http.get(
      `/rows?table_id=${encodeURIComponent(tableId)}`
    );
  }
  async search(request) {
    return this.http.post("/rows/search", request);
  }
  async update(rowId, values) {
    return this.http.patch(
      `/rows/${encodeURIComponent(rowId)}`,
      { values }
    );
  }
  async delete(rowId) {
    await this.http.delete(`/rows/${encodeURIComponent(rowId)}`);
  }
};

// src/resources/extraction-attempts.ts
var ExtractionAttemptsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get extraction attempts for a document
   */
  async getByDocument(documentId) {
    return this.http.get(
      `/documents/${documentId}/attempts`
    );
  }
  /**
   * List failed extraction attempts
   */
  async listFailed(tableId, status = "failed") {
    return this.http.get(
      `/tables/${tableId}/failed-attempts?status=${status}`
    );
  }
};

// src/resources/uploads.ts
var UploadsResource = class {
  constructor(_http, tusUploader, baseUrl) {
    this._http = _http;
    this.tusUploader = tusUploader;
    this.baseUrl = baseUrl;
  }
  async upload(file, metadata, options = {}) {
    const blobLike = file;
    const fileSize = "size" in file ? blobLike.size : file.byteLength;
    const fileType = "type" in file ? blobLike.type : "";
    const tusMetadata = {
      filename: metadata.filename,
      name: metadata.name ?? metadata.filename,
      type: metadata.type ?? (fileType || "application/pdf"),
      file_size: String(metadata.file_size ?? fileSize)
    };
    if (metadata.tableSlug) {
      tusMetadata.tableSlug = metadata.tableSlug;
    }
    if (metadata.user_id) {
      tusMetadata.user_id = metadata.user_id;
    }
    const result = await this.tusUploader.upload(file, {
      endpoint: `${this.baseUrl}/uploads`,
      metadata: tusMetadata,
      headers: { Authorization: this._http.getAuthorizationHeader() },
      chunkSize: options.chunkSize,
      onProgress: options.onProgress ? (bytesUploaded, bytesTotal) => options.onProgress?.({ bytesUploaded, bytesTotal }) : void 0
    });
    return {
      uploadId: result.uploadId,
      location: result.url,
      fileId: result.uploadId,
      status: "uploaded"
    };
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(http) {
    this.http = http;
  }
  async create(request) {
    return this.http.post("/webhooks", request);
  }
  async list() {
    return this.http.get("/webhooks");
  }
  async update(endpointId, request) {
    return this.http.patch(`/webhooks/${endpointId}`, request);
  }
  async listDeliveries(endpointId) {
    return this.http.get(`/webhooks/${endpointId}/deliveries`);
  }
  async delete(endpointId) {
    await this.http.delete(`/webhooks/${endpointId}`);
  }
};

// src/resources/routing-rules.ts
function mutationRequestOptions(options) {
  return options.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : void 0;
}
var RoutingRulesResource = class {
  constructor(http) {
    this.http = http;
  }
  async create(request, options = {}) {
    return this.http.post(
      "/routing-rules",
      request,
      mutationRequestOptions(options)
    );
  }
  async list() {
    return this.http.get("/routing-rules");
  }
  async get(id) {
    return this.http.get(`/routing-rules/${encodeURIComponent(id)}`);
  }
  async update(id, request, options = {}) {
    return this.http.patch(
      `/routing-rules/${encodeURIComponent(id)}`,
      request,
      mutationRequestOptions(options)
    );
  }
  async delete(id, options = {}) {
    await this.http.delete(
      `/routing-rules/${encodeURIComponent(id)}`,
      void 0,
      mutationRequestOptions(options)
    );
  }
};

// src/resources/sql.ts
function normalizeParameter(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  throw new TypeError(
    "SQL parameters must be strings, numbers, booleans, bigints, or Dates."
  );
}
function compileSqlQuery(input) {
  if (typeof input === "string") return { sql: input };
  const compiled = "toSQL" in input ? input.toSQL() : input;
  const rawParams = "params" in compiled ? compiled.params : "parameters" in compiled ? compiled.parameters : void 0;
  return {
    sql: compiled.sql,
    ...rawParams?.length ? { params: Array.from(rawParams, normalizeParameter) } : {}
  };
}
var SqlResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Run a single read-only SQLite query. Accepts SQL text, a Drizzle query
   * builder with `toSQL()`, or a Kysely compiled query.
   */
  async query(input, options = {}) {
    return this.http.post("/sql/query", {
      ...compileSqlQuery(input),
      ...options.maxRows !== void 0 ? { maxRows: options.maxRows } : {}
    });
  }
};

// src/resources/splitters.ts
function mutationRequestOptions2(options) {
  return options.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : void 0;
}
var SplittersResource = class {
  constructor(http) {
    this.http = http;
  }
  async create(request, options = {}) {
    return this.http.post(
      "/splitters",
      request,
      mutationRequestOptions2(options)
    );
  }
  async list() {
    return this.http.get("/splitters");
  }
  async get(id) {
    return this.http.get(
      `/splitters/${encodeURIComponent(id)}`
    );
  }
  async update(id, request, options = {}) {
    return this.http.patch(
      `/splitters/${encodeURIComponent(id)}`,
      request,
      mutationRequestOptions2(options)
    );
  }
  async publish(id, expectedDraftRevision, options = {}) {
    return this.http.post(
      `/splitters/${encodeURIComponent(id)}/publish`,
      { expected_draft_revision: expectedDraftRevision },
      mutationRequestOptions2(options)
    );
  }
  async test(id, pageCount, options = {}) {
    return this.http.post(
      `/splitters/${encodeURIComponent(id)}/test`,
      {
        page_count: pageCount,
        ...options.version === void 0 ? {} : { version: options.version }
      },
      mutationRequestOptions2(options)
    );
  }
  async run(id, documentId, options = {}) {
    return this.http.post(
      `/splitters/${encodeURIComponent(id)}/run`,
      {
        document_id: documentId,
        ...options.version === void 0 ? {} : { version: options.version }
      },
      mutationRequestOptions2(options)
    );
  }
  async delete(id, options = {}) {
    return this.http.delete(
      `/splitters/${encodeURIComponent(id)}`,
      void 0,
      mutationRequestOptions2(options)
    );
  }
};

// src/tus/uploader.ts
import { Upload } from "tus-js-client";
function extractUploadId(url) {
  const segments = url.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const encodedId = segments[segments.length - 1] ?? "";
  try {
    return decodeURIComponent(encodedId);
  } catch {
    return encodedId;
  }
}
var TusUploader = class {
  /**
   * Upload a file using TUS protocol
   */
  async upload(file, options) {
    return new Promise((resolve, reject) => {
      const upload = new Upload(file, {
        endpoint: options.endpoint,
        metadata: options.metadata,
        headers: options.headers,
        chunkSize: options.chunkSize || 8 * 1024 * 1024,
        // 8MB default
        retryDelays: options.retryDelays || [0, 3e3, 5e3, 1e4, 2e4],
        onError: (error) => {
          if (options.onError) {
            options.onError(error);
          }
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          if (options.onProgress) {
            options.onProgress(bytesUploaded, bytesTotal);
          }
        },
        onSuccess: () => {
          if (options.onSuccess) {
            options.onSuccess();
          }
          const url = upload.url || "";
          const uploadId = extractUploadId(url);
          resolve({
            uploadId,
            url
          });
        }
      });
      upload.start();
    });
  }
  /**
   * Create a new upload instance (for advanced usage)
   */
  createUpload(file, options) {
    return new Upload(file, {
      endpoint: options.endpoint,
      metadata: options.metadata,
      headers: options.headers,
      chunkSize: options.chunkSize || 8 * 1024 * 1024,
      retryDelays: options.retryDelays || [0, 3e3, 5e3, 1e4, 2e4],
      onError: options.onError,
      onProgress: options.onProgress,
      onSuccess: options.onSuccess
    });
  }
};

// src/client.ts
var Client = class {
  constructor(apiKey, options = {}) {
    this.baseUrl = (options.baseUrl || "https://api.pdfparse.net/v1").replace(/\/$/, "");
    this.http = new HttpClient({
      baseUrl: this.baseUrl,
      apiKey,
      timeout: options.timeout,
      retries: options.retries,
      retryDelay: options.retryDelay
    });
    this.tables = new TablesResource(this.http);
    this.documents = new DocumentsResource(this.http);
    this.jobs = new JobsResource(this.http);
    this.rows = new RowsResource(this.http);
    this.extractionAttempts = new ExtractionAttemptsResource(this.http);
    this.uploads = new UploadsResource(this.http, new TusUploader(), this.baseUrl);
    this.webhooks = new WebhooksResource(this.http);
    this.routingRules = new RoutingRulesResource(this.http);
    this.sql = new SqlResource(this.http);
    this.splitters = new SplittersResource(this.http);
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  getHttpClient() {
    return this.http;
  }
};

// src/adapters/base.ts
function isSchemaAdapter(value) {
  return typeof value === "object" && value !== null && "parse" in value && "safeParse" in value && "validate" in value && typeof value.parse === "function" && typeof value.safeParse === "function" && typeof value.validate === "function";
}

// src/adapters/zod.ts
function isZodAvailable() {
  try {
    __require("zod");
    return true;
  } catch {
    return false;
  }
}
function formatZodError(error) {
  return {
    message: error.message,
    issues: error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.filter(
        (segment) => typeof segment === "string" || typeof segment === "number"
      ),
      code: issue.code
    }))
  };
}
var ZodAdapter = class {
  constructor(schema) {
    if (!isZodAvailable()) {
      throw new Error(
        "Zod is not installed. Please install it with: npm install zod"
      );
    }
    this.schema = schema;
  }
  parse(data) {
    return this.schema.parse(data);
  }
  safeParse(data) {
    const result = this.schema.safeParse(data);
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: formatZodError(result.error)
      };
    }
  }
  validate(data) {
    return this.schema.safeParse(data).success;
  }
};
function createZodAdapter(schema) {
  return new ZodAdapter(schema);
}
function isZodSchema(value) {
  if (!isZodAvailable()) {
    return false;
  }
  try {
    const { ZodType } = __require("zod");
    return value instanceof ZodType;
  } catch {
    return false;
  }
}

// src/adapters/valibot.ts
function isValibotAvailable() {
  try {
    __require("valibot");
    return true;
  } catch {
    return false;
  }
}
function formatValibotError(error) {
  const issues = error.issues || [];
  return {
    message: error.message || "Validation failed",
    issues: issues.map((issue) => ({
      message: issue.message || "Invalid value",
      path: issue.path?.map((p) => p.key || p) || [],
      code: issue.type || "invalid_type"
    }))
  };
}
var ValibotAdapter = class {
  constructor(schema) {
    if (!isValibotAvailable()) {
      throw new Error(
        "Valibot is not installed. Please install it with: npm install valibot"
      );
    }
    this.schema = schema;
  }
  parse(data) {
    const { parse } = __require("valibot");
    return parse(this.schema, data);
  }
  safeParse(data) {
    const { safeParse } = __require("valibot");
    const result = safeParse(this.schema, data);
    if (result.success) {
      return {
        success: true,
        data: result.output
      };
    } else {
      return {
        success: false,
        error: formatValibotError(result.issues)
      };
    }
  }
  validate(data) {
    const { safeParse } = __require("valibot");
    return safeParse(this.schema, data).success;
  }
};
function createValibotAdapter(schema) {
  return new ValibotAdapter(schema);
}
function isValibotSchema(value) {
  if (!isValibotAvailable()) {
    return false;
  }
  try {
    const { BaseSchema } = __require("valibot");
    return value instanceof BaseSchema;
  } catch {
    return false;
  }
}

// src/adapters/yup.ts
function isYupAvailable() {
  try {
    __require("yup");
    return true;
  } catch {
    return false;
  }
}
function formatYupError(error) {
  const issues = [];
  if (error.path) {
    issues.push({
      message: error.message || "Validation failed",
      path: [error.path],
      code: error.type || "validation_error"
    });
  }
  if (error.inner && Array.isArray(error.inner)) {
    for (const innerError of error.inner) {
      if (innerError.path) {
        issues.push({
          message: innerError.message || "Validation failed",
          path: [innerError.path],
          code: innerError.type || "validation_error"
        });
      }
    }
  }
  return {
    message: error.message || "Validation failed",
    issues: issues.length > 0 ? issues : void 0
  };
}
var YupAdapter = class {
  constructor(schema) {
    if (!isYupAvailable()) {
      throw new Error(
        "Yup is not installed. Please install it with: npm install yup"
      );
    }
    this.schema = schema;
  }
  async parse(data) {
    const yup = __require("yup");
    try {
      return await this.schema.validate(data, { abortEarly: false });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw new Error(formatYupError(error).message);
      }
      throw error;
    }
  }
  safeParse(data) {
    const yup = __require("yup");
    try {
      const result = this.schema.validateSync(data, { abortEarly: false });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
        return {
          success: false,
          error: formatYupError(error)
        };
      }
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Validation failed"
        }
      };
    }
  }
  validate(data) {
    const result = this.safeParse(data);
    return result.success;
  }
};
function createYupAdapter(schema) {
  return new YupAdapter(schema);
}
function isYupSchema(value) {
  if (!isYupAvailable()) {
    return false;
  }
  try {
    const { Schema } = __require("yup");
    return value instanceof Schema;
  } catch {
    return false;
  }
}

// src/adapters/typebox.ts
function isTypeBoxAvailable() {
  try {
    __require("@sinclair/typebox");
    return true;
  } catch {
    return false;
  }
}
function formatTypeBoxError(error) {
  const issues = [];
  if (error.path) {
    issues.push({
      message: error.message || "Validation failed",
      path: error.path.split("/").filter((p) => p),
      code: "validation_error"
    });
  }
  return {
    message: error.message || "Validation failed",
    issues: issues.length > 0 ? issues : void 0
  };
}
var TypeBoxAdapter = class {
  constructor(schema) {
    if (!isTypeBoxAvailable()) {
      throw new Error(
        "TypeBox is not installed. Please install it with: npm install @sinclair/typebox"
      );
    }
    this.schema = schema;
  }
  parse(data) {
    const { Value } = __require("@sinclair/typebox/value");
    const result = Value.Check(this.schema, data);
    if (!result) {
      const errors = [...Value.Errors(this.schema, data)];
      const firstError = errors[0];
      throw new Error(
        firstError?.message || "Validation failed"
      );
    }
    return Value.Cast(this.schema, data);
  }
  safeParse(data) {
    const { Value } = __require("@sinclair/typebox/value");
    const result = Value.Check(this.schema, data);
    if (result) {
      return {
        success: true,
        data: Value.Cast(this.schema, data)
      };
    } else {
      const errors = [...Value.Errors(this.schema, data)];
      const firstError = errors[0];
      return {
        success: false,
        error: formatTypeBoxError({
          message: firstError?.message || "Validation failed",
          path: firstError?.path
        })
      };
    }
  }
  validate(data) {
    const { Value } = __require("@sinclair/typebox/value");
    return Value.Check(this.schema, data);
  }
};
function createTypeBoxAdapter(schema) {
  return new TypeBoxAdapter(schema);
}
function isTypeBoxSchema(value) {
  if (!isTypeBoxAvailable()) {
    return false;
  }
  try {
    const { TSchema } = __require("@sinclair/typebox");
    return typeof value === "object" && value !== null && "static" in value;
  } catch {
    return false;
  }
}

// src/utils/schema-converter.ts
function toSchemaAdapter(schema) {
  if (isZodSchema(schema)) {
    return createZodAdapter(schema);
  }
  if (isValibotSchema(schema)) {
    return createValibotAdapter(schema);
  }
  if (isYupSchema(schema)) {
    return createYupAdapter(schema);
  }
  if (isTypeBoxSchema(schema)) {
    return createTypeBoxAdapter(schema);
  }
  return null;
}
function columnSchemaToObject(column) {
  const obj = {
    name: column.name,
    prompt: column.prompt
  };
  if (column.primaryKey !== void 0) obj.primaryKey = column.primaryKey;
  if (column.unique !== void 0) obj.unique = column.unique;
  if (column.autoIncrement !== void 0) obj.autoIncrement = column.autoIncrement;
  if (column.nullable !== void 0) obj.nullable = column.nullable;
  if (column.reanalyzeExisting !== void 0) obj.reanalyzeExisting = column.reanalyzeExisting;
  if (column.type) obj.type = column.type;
  if (column.referencedTable) obj.referencedTable = column.referencedTable;
  if (column.referencedColumn) obj.referencedColumn = column.referencedColumn;
  if (column.parentTable) obj.parentTable = column.parentTable;
  return obj;
}
function tableSchemaToObject(schema) {
  return {
    name: schema.name,
    columns: schema.columns.map(columnSchemaToObject),
    inlineArrays: schema.inlineArrays?.map((ia) => ({
      name: ia.name,
      columns: ia.columns.map(columnSchemaToObject)
    })),
    childTables: schema.childTables?.map((ct) => ({
      name: ct.name,
      columns: ct.columns.map(columnSchemaToObject)
    }))
  };
}
function createZodSchemaFromColumns(columns) {
  try {
    const { z } = __require("zod");
    if (!z) return null;
    const shape = {};
    for (const column of columns) {
      let field;
      switch (column.type) {
        case "number":
          field = z.number();
          break;
        case "date":
          field = z.string().datetime();
          break;
        case "boolean":
          field = z.boolean();
          break;
        default:
          field = z.string();
      }
      if (column.nullable) {
        field = field.nullable();
      }
      shape[column.name] = field;
    }
    return z.object(shape);
  } catch {
    return null;
  }
}
function createValibotSchemaFromColumns(columns) {
  try {
    const { object, string, number, boolean, nullable } = __require("valibot");
    if (!object) return null;
    const entries = [];
    for (const column of columns) {
      let field;
      switch (column.type) {
        case "number":
          field = number();
          break;
        case "date":
          field = string();
          break;
        case "boolean":
          field = boolean();
          break;
        default:
          field = string();
      }
      if (column.nullable) {
        field = nullable(field);
      }
      entries.push([column.name, field]);
    }
    return object(Object.fromEntries(entries));
  } catch {
    return null;
  }
}

// src/row-id.ts
var ROW_ID_SEPARATOR = ":";
function encodeRowId(tableId, documentRecordId) {
  return `${encodeURIComponent(tableId)}${ROW_ID_SEPARATOR}${encodeURIComponent(documentRecordId)}`;
}
function decodeRowId(rowId) {
  const separatorIndex = rowId.indexOf(ROW_ID_SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === rowId.length - 1) {
    throw new Error("Invalid row_id");
  }
  return {
    tableId: decodeURIComponent(rowId.slice(0, separatorIndex)),
    documentRecordId: decodeURIComponent(rowId.slice(separatorIndex + 1))
  };
}

// src/mcp/client.ts
var McpClient = class {
  constructor(options) {
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }
  async callTool(name, argumentsPayload) {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
        "MCP-Method": "tools/call",
        "MCP-Name": name,
        Authorization: `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name,
          arguments: argumentsPayload,
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientInfo": { name: "@ocr-monorepo/client-sdk", version: "0.1.0" },
            "io.modelcontextprotocol/clientCapabilities": {}
          }
        }
      })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP request failed (${response.status}): ${text}`);
    }
    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error.message || "MCP tool call failed");
    }
    return payload.result ?? { content: [] };
  }
};
export {
  ApiError,
  Client,
  DocumentsResource,
  ExtractionAttemptsResource,
  FileProcessingError,
  ForbiddenError,
  HttpClient,
  InsufficientTokensError,
  JobsResource,
  McpClient,
  NotFoundError,
  RoutingRulesResource,
  RowsResource,
  SchemaMismatchError,
  SplittersResource,
  SqlResource,
  StorageLimitExceededError,
  TablesResource,
  TypeBoxAdapter,
  UnauthorizedError,
  ValibotAdapter,
  ValidationError,
  WebhooksResource,
  WorkflowError,
  YupAdapter,
  ZodAdapter,
  columnSchemaToObject,
  compileSqlQuery,
  createCancellablePoller,
  createErrorFromCode,
  createTypeBoxAdapter,
  createValibotAdapter,
  createValibotSchemaFromColumns,
  createYupAdapter,
  createZodAdapter,
  createZodSchemaFromColumns,
  decodeRowId,
  encodeRowId,
  isSchemaAdapter,
  isTypeBoxSchema,
  isValibotSchema,
  isYupSchema,
  isZodSchema,
  poll,
  pollDocument,
  pollJob,
  tableSchemaToObject,
  toSchemaAdapter
};
