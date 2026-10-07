# PdfParse assistant plugins

The same package supports OpenAI and Claude Code. Claude's manifest is `.claude-plugin/plugin.json`; the public marketplace is [PabloG6/pdfparse-integrations](https://github.com/PabloG6/pdfparse-integrations). Install with `/plugin marketplace add PabloG6/pdfparse-integrations` followed by `/plugin install pdfparse@pdfparse`, then authorize PdfParse in the MCP connection. Claude web/Desktop uses the remote connector URL separately.

This package bundles OAuth MCP access and three skills for ChatGPT and Codex. `plugin.json` and `mcp.json` use the portable Agent Plugins 1.0.0 layout. `.codex-plugin/plugin.json` and `.mcp.json` provide the compatibility layout. Keep both manifests synchronized; `pnpm plugin:check` checks this and verifies skill/review tool references. The repository marketplace at `.agents/plugins/marketplace.json` points to this local package.

Build with `pnpm plugin:build`. The uploadable draft ZIP is `artifacts/plugins/pdfparse-0.1.0.zip`. This command validates the package contract locally; it does not execute the review scenarios in ChatGPT or prove production readiness.

## Runtime contract

- One remote MCP server: `https://mcp.pdfparse.net/mcp`, authenticated using Better Auth OAuth. No project API keys or credentials are included in the package.
- Codex passes local PDF bytes through `documents.upload`. ChatGPT attachments use `documents.upload_file` and the documented `openai/fileParams` input shape. Maximum PDF size: 8 MiB.
- Configure `PLUGIN_FILE_DOWNLOAD_HOSTS` on the MCP Worker with the exact HTTPS download hostnames observed from authorized ChatGPT attachments. No wildcard hosts, IP literals, credentials, redirects, or OAuth token forwarding are accepted. Leave this unset to fail closed. OpenAI's file schema does not guarantee a hostname; verify actual host delivery before launch. Do not add user-controlled or private-network hostnames.
- `connection.profile` returns only the authenticated account's opaque ID and is marked `openai/profile`.
- Tools publish titles, output schemas, all three approval annotations, and OAuth scope metadata through the SDK-supported `_meta.securitySchemes` compatibility field. Read operations require `mcp:read`; mutations require `mcp:write`. Missing scopes return an OAuth challenge in tool result metadata.
- The server can return the domain-verification token at `/.well-known/openai-apps-challenge` when `OPENAI_APPS_CHALLENGE` is configured. Use the exact token from OpenAI's portal; no placeholder token is installed.
- `projects.create` creates an empty project and returns `{ project: { id, slug } }`. It uses the existing admin creation operation and requires write consent, a non-anonymous account, and an active subscription with remaining credits.
- `workflow.setup` requires `project: { existing_slug }` and never creates projects. It currently provisions one table and routing rule per intent, with optional inbox and logical splitter, synchronously with D1 resume checkpoints. Multi-table atomic setup and a background SetupWorkflow are separate pending work.

## Public release gates

Production MCP, auth, service entrypoints, migrations, and consent UI were deployed on September 30. The plugin has not been submitted or approved in OpenAI’s directory. Release automation is `.github/workflows/deploy.yml`: pushing `main` deploys production, including MCP secrets and the packaged plugin artifact.

1. Apply generated OAuth and setup migrations through the existing deployment process. Deploy auth, consent UI, admin/project/upload service entrypoints, and MCP together. Verify a complete sign-in and consent round trip, token refresh, legacy MCP handshake, and one real PDF through extraction and row persistence.
2. Configure approved attachment download hosts and verify a real ChatGPT attachment, including expiry and over-limit errors. Run all positive and negative manifest scenarios in each target host. Their inclusion in the manifest is not an execution record.
3. In [OpenAI's plugin portal](https://platform.openai.com/plugins), use a verified developer organization with Apps Management access. Verify the MCP domain with the portal's challenge token, configured on that host.
4. Supply a separate reviewer account with active PdfParse quota and sample data through the portal's private credentials fields. Never add credentials to this ZIP or repository.
5. Record an accessible walkthrough and add its real URL as `extensions.com.openai.review.demo_recording_url` in both manifests. Add real attachment fixtures if required by the review scenario. Rebuild the ZIP.
6. Submit the initial package with its MCP component attached. Review the portal's publication and policy declarations before submission. Directory approval is an external gate; local packaging does not constitute approval.

Official references: [package format](https://developers.openai.com/plugins/build/plugins), [file and tool metadata](https://developers.openai.com/plugins/reference), [submission requirements](https://developers.openai.com/plugins/deploy/submission).

## GitHub deployment values

The MCP job uses the existing environment `MISTRAL_API_KEY` and `CLOUDFLARE_DEPLOY_TOKEN` secrets and `CLOUDFLARE_ACCOUNT_ID` variable. It provisions Mistral into the Worker automatically. `MCP_ANALYSIS_MODEL` is an environment variable with default `mistral-small-latest`. Set `PLUGIN_FILE_DOWNLOAD_HOSTS` only after verifying the actual ChatGPT signed download hosts; missing configuration leaves attachment downloads disabled while base64 uploads remain available. Set the optional environment secret `OPENAI_APPS_CHALLENGE` to the real portal token to provision the domain proof. Temporary secret files are restricted and deleted after deployment. OAuth issuer/resource and private service bindings are versioned in the Worker configs.
