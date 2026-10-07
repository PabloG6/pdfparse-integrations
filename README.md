# PdfParse integrations

[PdfParse](https://pdfparse.net) turns PDFs into structured tables. This repository distributes the official MCP connection, Claude Code and OpenAI plugin packages, and TypeScript SDK. The hosted service requires a PdfParse account; processing consumes your PdfParse plan quota.

## MCP

Connect to `https://mcp.pdfparse.net/mcp` using Streamable HTTP and OAuth. Project API keys are not accepted by this OAuth endpoint. [Setup and tool reference](https://pdfparse.net/docs/mcp).

## Claude Code

```text
/plugin marketplace add PabloG6/pdfparse-integrations
/plugin install pdfparse@pdfparse
```

Sign in to PdfParse when Claude requests MCP authorization. The plugin includes get-started, document extraction, and workflow setup skills. Alternatively: `claude mcp add --transport http pdfparse https://mcp.pdfparse.net/mcp`.

For Claude web or Desktop, add that URL in Settings → Connectors → Add custom connector and authorize your PdfParse account. A Claude Code marketplace installation does not install a Claude web connector.

## ChatGPT and Codex

The [release ZIP](https://github.com/PabloG6/pdfparse-integrations/releases) contains the OpenAI plugin package. ChatGPT directory review is pending; the ZIP is a submission package, not an approved listing. In ChatGPT developer mode, add `https://mcp.pdfparse.net/mcp` as an OAuth MCP connection. See [submission requirements](plugins/pdfparse/README.md).

## TypeScript SDK

Download `pdfparse-sdk-0.1.0.tgz` from [releases](https://github.com/PabloG6/pdfparse-integrations/releases) and install it with `npm install ./pdfparse-sdk-0.1.0.tgz`. The public npm listing is pending publisher authentication.

```ts
import { Client } from "pdfparse-sdk";
const client = new Client(process.env.PDFPARSE_API_KEY!);
const tables = await client.tables.list();
```

The SDK ships JavaScript for ESM and CommonJS with TypeScript declarations. Its project API key is separate from MCP OAuth. [SDK reference](sdk/README.md).

## Directory metadata

`server.json` describes the hosted endpoint for the official MCP Registry. A registry listing does not imply ChatGPT or Anthropic directory approval. [Website](https://pdfparse.net/mcp) · [Support](https://pdfparse.net/contact) · [Privacy](https://pdfparse.net/privacy) · [Terms](https://pdfparse.net/terms-and-conditions).
