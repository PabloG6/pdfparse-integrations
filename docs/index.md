---
layout: default
title: PdfParse MCP and integrations
---

# PdfParse MCP and integrations

Turn PDFs into structured tables and reusable document workflows from your AI assistant.

[Open PdfParse](https://pdfparse.net) · [Connection and tool reference](https://pdfparse.net/docs/mcp) · [Official integrations repository](https://github.com/PabloG6/pdfparse-integrations)

## Connect your assistant

**Remote endpoint:** `https://mcp.pdfparse.net/mcp`  
**Transport:** Streamable HTTP  
**Sign-in:** OAuth with your PdfParse account  
**Permissions:** `mcp:read` and `mcp:write`

Add the endpoint in a client that supports remote MCP and OAuth, then sign in and approve access. Project API keys authenticate the REST API and cannot authenticate this MCP endpoint.

### Claude Code

```text
/plugin marketplace add PabloG6/pdfparse-integrations
/plugin install pdfparse@pdfparse
```

Or connect directly:

```sh
claude mcp add --transport http pdfparse https://mcp.pdfparse.net/mcp
```

### Codex

```sh
codex mcp add pdfparse --url https://mcp.pdfparse.net/mcp
codex mcp login pdfparse
```

### Claude and ChatGPT

In Claude web or Desktop, add the remote endpoint as a custom connector and authorize your account. In ChatGPT Plugins, select **Add custom MCP server**, enter the endpoint, and configure OAuth. See the [official connection quickstart](https://developers.openai.com/plugins/quickstart). Availability depends on your client's plan and settings. An MCP Registry listing does not imply approval in the ChatGPT or Anthropic directories.

## What you can ask for

- Discover your projects, create extraction tables, and configure document routing.
- Set up a workflow in an existing project with fields, routing, and an optional inbox or splitter.
- Upload PDF bytes, check extraction jobs, and query the saved rows.
- Inspect and manage document splitters and routing rules.

For example: “Set up purchase-order extraction in my Procurements project. Capture the supplier, date, currency, and total.”

Your client must be able to deliver the PDF bytes. Base64 uploads accept PDFs up to 8 MiB. Attachment downloads depend on an approved delivery host. Extraction is asynchronous: check job status and saved rows, then review the results against the source.

A PdfParse account is required. Processing uses your plan quota.

## Download the packages

[Release packages](https://github.com/PabloG6/pdfparse-integrations/releases) include the assistant plugin ZIP and TypeScript SDK tarball. Read the [SDK reference](https://github.com/PabloG6/pdfparse-integrations/tree/main/sdk) and [plugin requirements](https://github.com/PabloG6/pdfparse-integrations/blob/main/plugins/pdfparse/README.md) before installing.

## Registry metadata

Official MCP Registry identifier: `io.github.PabloG6/pdfparse`.

[Server metadata](https://github.com/PabloG6/pdfparse-integrations/blob/main/server.json) · [Tool catalog](https://pdfparse.net/mcp/tools.json) · [Support](https://pdfparse.net/contact) · [Privacy](https://pdfparse.net/privacy) · [Terms](https://pdfparse.net/terms-and-conditions)
