#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DifyClient } from "./dify-client.js";

const DIFY_BASE_URL = process.env.DIFY_BASE_URL;
const DIFY_EMAIL = process.env.DIFY_EMAIL;
const DIFY_PASSWORD = process.env.DIFY_PASSWORD;

if (!DIFY_BASE_URL || !DIFY_EMAIL || !DIFY_PASSWORD) {
	console.error("Error: DIFY_BASE_URL, DIFY_EMAIL, DIFY_PASSWORD env vars required");
	process.exit(1);
}

const client = new DifyClient(DIFY_BASE_URL, DIFY_EMAIL, DIFY_PASSWORD);

const server = new McpServer({
	name: "dify-mcp-server",
	version: "0.2.0",
});

// --- Apps ---

server.tool(
	"list_apps",
	"List all Dify applications",
	{ page: z.number().optional(), limit: z.number().optional() },
	async ({ page, limit }) => {
		const data = await client.listApps(page ?? 1, limit ?? 30);
		const summary = data.data.map((a) => `- ${a.name} (${a.mode}) [${a.id}]`).join("\n");
		return {
			content: [{ type: "text", text: `Total: ${data.total}\n\n${summary}` }],
		};
	},
);

server.tool(
	"create_app",
	"Create a new Dify application (chat, agent-chat, advanced-chat, workflow, completion)",
	{
		name: z.string().describe("Application name"),
		mode: z
			.enum(["chat", "agent-chat", "advanced-chat", "workflow", "completion"])
			.describe("Application type"),
		description: z.string().optional().describe("Application description"),
	},
	async ({ name, mode, description }) => {
		const app = await client.createApp(name, mode, description);
		return {
			content: [{ type: "text", text: `Created: ${app.name} (${app.mode})\nID: ${app.id}` }],
		};
	},
);

server.tool(
	"delete_app",
	"Delete a Dify application by ID",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const result = await client.deleteApp(app_id);
		return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
	},
);

server.tool(
	"copy_app",
	"Duplicate an existing Dify application",
	{
		app_id: z.string().describe("Source application ID"),
		name: z.string().optional().describe("New name for the copy"),
	},
	async ({ app_id, name }) => {
		const app = await client.copyApp(app_id, name);
		return {
			content: [{ type: "text", text: `Copied: ${app.name} (${app.mode})\nNew ID: ${app.id}` }],
		};
	},
);

// --- DSL Import/Export ---

server.tool(
	"import_dsl",
	"Import a Dify application from YAML DSL content",
	{
		yaml_content: z.string().describe("YAML DSL content defining the application"),
		name: z.string().optional().describe("Override application name"),
		description: z.string().optional().describe("Override description"),
	},
	async ({ yaml_content, name, description }) => {
		const result = await client.importDSL(yaml_content, name, description);
		let text = `Import status: ${result.status}\nApp ID: ${result.app_id || result.id}`;
		if (result.status === "pending") {
			const confirmed = await client.confirmImport(result.id);
			text += `\nConfirmed: ${confirmed.status}, App ID: ${confirmed.app_id}`;
		}
		return { content: [{ type: "text", text }] };
	},
);

server.tool(
	"export_app",
	"Export a Dify application as YAML DSL",
	{ app_id: z.string().describe("Application ID to export") },
	async ({ app_id }) => {
		const result = await client.exportApp(app_id);
		return { content: [{ type: "text", text: result.data }] };
	},
);

// --- Workflow ---

server.tool(
	"get_workflow",
	"Get the draft workflow of an application (nodes, edges, features)",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const wf = await client.getWorkflowDraft(app_id);
		return {
			content: [{ type: "text", text: JSON.stringify(wf, null, 2) }],
		};
	},
);

server.tool(
	"update_workflow",
	"Update the draft workflow graph of an application",
	{
		app_id: z.string().describe("Application ID"),
		graph: z.string().describe("Workflow graph JSON (nodes + edges)"),
		features: z.string().describe("Workflow features JSON"),
		hash: z.string().describe("Current workflow hash (from get_workflow)"),
	},
	async ({ app_id, graph, features, hash }) => {
		const result = await client.updateWorkflowDraft(
			app_id,
			JSON.parse(graph),
			JSON.parse(features),
			hash,
		);
		return { content: [{ type: "text", text: `Update: ${result.result}` }] };
	},
);

server.tool(
	"publish_workflow",
	"Publish the draft workflow to make it live",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const result = await client.publishWorkflow(app_id);
		return { content: [{ type: "text", text: `Published: ${result.result}` }] };
	},
);

// --- API Access ---

server.tool(
	"enable_api",
	"Enable API access for an application",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const result = await client.enableApi(app_id);
		return { content: [{ type: "text", text: `API enabled: ${result.result}` }] };
	},
);

server.tool(
	"enable_site",
	"Enable web site (chat UI) access for an application",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const result = await client.enableSite(app_id);
		return { content: [{ type: "text", text: `Site enabled: ${result.result}` }] };
	},
);

server.tool(
	"get_api_keys",
	"Get API keys for an application",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const data = await client.getAppApiKeys(app_id);
		const keys = data.data.map((k) => `- ${k.token} (${k.id})`).join("\n");
		return { content: [{ type: "text", text: keys || "No API keys found" }] };
	},
);

server.tool(
	"create_api_key",
	"Create a new API key for an application",
	{ app_id: z.string().describe("Application ID") },
	async ({ app_id }) => {
		const key = await client.createAppApiKey(app_id);
		return { content: [{ type: "text", text: `API Key: ${key.token}\nID: ${key.id}` }] };
	},
);

// --- Knowledge Base (Datasets) ---

server.tool(
	"list_datasets",
	"List all knowledge base datasets",
	{ page: z.number().optional(), limit: z.number().optional() },
	async ({ page, limit }) => {
		const data = await client.listDatasets(page ?? 1, limit ?? 30);
		const summary = data.data
			.map((d) => `- ${d.name} (${d.document_count} docs, ${d.word_count} words) [${d.id}]`)
			.join("\n");
		return {
			content: [{ type: "text", text: `Total: ${data.total}\n\n${summary || "No datasets"}` }],
		};
	},
);

server.tool(
	"create_dataset",
	"Create a new knowledge base dataset",
	{
		name: z.string().describe("Dataset name"),
		description: z.string().optional().describe("Dataset description"),
		indexing_technique: z
			.enum(["high_quality", "economy"])
			.optional()
			.describe("Indexing technique (default: high_quality)"),
	},
	async ({ name, description, indexing_technique }) => {
		const ds = await client.createDataset(name, description, indexing_technique ?? "high_quality");
		return {
			content: [{ type: "text", text: `Created dataset: ${ds.name}\nID: ${ds.id}` }],
		};
	},
);

server.tool(
	"delete_dataset",
	"Delete a knowledge base dataset",
	{ dataset_id: z.string().describe("Dataset ID") },
	async ({ dataset_id }) => {
		await client.deleteDataset(dataset_id);
		return { content: [{ type: "text", text: "Dataset deleted" }] };
	},
);

server.tool(
	"list_documents",
	"List documents in a knowledge base dataset",
	{
		dataset_id: z.string().describe("Dataset ID"),
		page: z.number().optional(),
		limit: z.number().optional(),
	},
	async ({ dataset_id, page, limit }) => {
		const data = await client.listDocuments(dataset_id, page ?? 1, limit ?? 30);
		const summary = data.data
			.map((d) => `- ${d.name} (${d.word_count} words, ${d.indexing_status}) [${d.id}]`)
			.join("\n");
		return {
			content: [{ type: "text", text: `Total: ${data.total}\n\n${summary || "No documents"}` }],
		};
	},
);

server.tool(
	"create_document_by_text",
	"Add a text document to a knowledge base dataset",
	{
		dataset_id: z.string().describe("Dataset ID"),
		name: z.string().describe("Document name"),
		text: z.string().describe("Document text content"),
	},
	async ({ dataset_id, name, text }) => {
		const result = await client.createDocumentByText(dataset_id, name, text);
		return {
			content: [
				{
					type: "text",
					text: `Document created: ${result.document.name}\nID: ${result.document.id}\nBatch: ${result.batch}`,
				},
			],
		};
	},
);

server.tool(
	"delete_document",
	"Delete a document from a knowledge base dataset",
	{
		dataset_id: z.string().describe("Dataset ID"),
		document_id: z.string().describe("Document ID"),
	},
	async ({ dataset_id, document_id }) => {
		const result = await client.deleteDocument(dataset_id, document_id);
		return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
	},
);

server.tool(
	"list_segments",
	"List segments (chunks) of a document",
	{
		dataset_id: z.string().describe("Dataset ID"),
		document_id: z.string().describe("Document ID"),
		page: z.number().optional(),
		limit: z.number().optional(),
	},
	async ({ dataset_id, document_id, page, limit }) => {
		const data = await client.listSegments(dataset_id, document_id, page ?? 1, limit ?? 30);
		const summary = data.data
			.map(
				(s) =>
					`- [${s.id}] ${s.content.substring(0, 80)}${s.content.length > 80 ? "..." : ""} (${s.word_count} words)`,
			)
			.join("\n");
		return {
			content: [{ type: "text", text: `Total: ${data.total}\n\n${summary || "No segments"}` }],
		};
	},
);

server.tool(
	"create_segment",
	"Add a segment (chunk) to a document",
	{
		dataset_id: z.string().describe("Dataset ID"),
		document_id: z.string().describe("Document ID"),
		content: z.string().describe("Segment text content"),
		answer: z.string().optional().describe("Segment answer (for Q&A datasets)"),
		keywords: z.array(z.string()).optional().describe("Keywords for the segment"),
	},
	async ({ dataset_id, document_id, content, answer, keywords }) => {
		const result = await client.createSegment(dataset_id, document_id, content, answer, keywords);
		return {
			content: [{ type: "text", text: `Segment created: ${result.data.id}` }],
		};
	},
);

server.tool(
	"update_segment",
	"Update a segment (chunk) in a document",
	{
		dataset_id: z.string().describe("Dataset ID"),
		document_id: z.string().describe("Document ID"),
		segment_id: z.string().describe("Segment ID"),
		content: z.string().describe("Updated text content"),
		answer: z.string().optional().describe("Updated answer"),
		keywords: z.array(z.string()).optional().describe("Updated keywords"),
	},
	async ({ dataset_id, document_id, segment_id, content, answer, keywords }) => {
		const result = await client.updateSegment(
			dataset_id,
			document_id,
			segment_id,
			content,
			answer,
			keywords,
		);
		return {
			content: [{ type: "text", text: `Segment updated: ${result.data.id}` }],
		};
	},
);

server.tool(
	"delete_segment",
	"Delete a segment (chunk) from a document",
	{
		dataset_id: z.string().describe("Dataset ID"),
		document_id: z.string().describe("Document ID"),
		segment_id: z.string().describe("Segment ID"),
	},
	async ({ dataset_id, document_id, segment_id }) => {
		const result = await client.deleteSegment(dataset_id, document_id, segment_id);
		return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
	},
);

// --- Start ---

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Dify MCP Server v0.2.0 running on stdio");
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});
