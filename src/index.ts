#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DifyClient } from "./dify-client.js";
import { registerTools } from "./tools/index.js";

const DIFY_BASE_URL = process.env.DIFY_BASE_URL;
const DIFY_EMAIL = process.env.DIFY_EMAIL;
const DIFY_PASSWORD = process.env.DIFY_PASSWORD;

if (!DIFY_BASE_URL || !DIFY_EMAIL || !DIFY_PASSWORD) {
	console.error("Error: DIFY_BASE_URL, DIFY_EMAIL, DIFY_PASSWORD env vars required");
	process.exit(1);
}

const client = new DifyClient(DIFY_BASE_URL, DIFY_EMAIL, DIFY_PASSWORD);

const server = new McpServer(
	{ name: "dify-mcp-server", version: "0.7.1" },
	{ capabilities: { logging: {} } },
);

registerTools(server, client);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Dify MCP Server v0.7.1 running on stdio");
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});
