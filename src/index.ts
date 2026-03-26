import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DifyClient } from "./dify-client.js";

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || "https://dify.api-app.org";
const DIFY_EMAIL = process.env.DIFY_EMAIL || "";
const DIFY_PASSWORD = process.env.DIFY_PASSWORD || "";

const client = new DifyClient(DIFY_BASE_URL);

const server = new McpServer({
	name: "dify-mcp-server",
	version: "0.1.0",
});

// --- Auth ---

server.tool("login", "Authenticate with Dify Console API", {}, async () => {
	if (!DIFY_EMAIL || !DIFY_PASSWORD) {
		return {
			content: [{ type: "text", text: "Error: DIFY_EMAIL and DIFY_PASSWORD env vars required" }],
		};
	}
	try {
		const result = await client.login(DIFY_EMAIL, DIFY_PASSWORD);
		return { content: [{ type: "text", text: result }] };
	} catch (e) {
		return { content: [{ type: "text", text: `Login failed: ${e}` }] };
	}
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

// --- Start ---

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Dify MCP Server running on stdio");
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});
