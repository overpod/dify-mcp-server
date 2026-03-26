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
	version: "0.7.0",
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

// --- Model Providers ---

server.tool(
	"list_model_providers",
	"List all configured model providers (OpenAI, Anthropic, etc.) with their status",
	{
		model_type: z
			.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
			.optional()
			.describe("Filter by model type"),
	},
	async ({ model_type }) => {
		const data = await client.listModelProviders(model_type);
		const summary = data.data
			.map(
				(p) =>
					`- ${p.label.en_US || p.provider} [${p.provider}] — ${p.custom_configuration?.status || "not configured"} (types: ${p.supported_model_types.join(", ")})`,
			)
			.join("\n");
		return {
			content: [
				{ type: "text", text: `Providers: ${data.data.length}\n\n${summary || "No providers"}` },
			],
		};
	},
);

server.tool(
	"list_models",
	"List models for a specific provider",
	{
		provider: z.string().describe("Provider identifier (e.g. openai, anthropic, azure_openai)"),
	},
	async ({ provider }) => {
		const data = await client.listProviderModels(provider);
		const summary = data.data
			.map((m) => `- ${m.label.en_US || m.model} [${m.model}] — ${m.status} (${m.model_type})`)
			.join("\n");
		return {
			content: [{ type: "text", text: `Models: ${data.data.length}\n\n${summary || "No models"}` }],
		};
	},
);

server.tool(
	"list_models_by_type",
	"List all available models across all providers for a given type (e.g. all LLMs)",
	{
		model_type: z
			.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
			.describe("Model type to list"),
	},
	async ({ model_type }) => {
		const data = await client.listModelsByType(model_type);
		const summary = data.data
			.map(
				(m) =>
					`- ${m.label.en_US || m.model} [${m.model}] from ${m.provider || "unknown"} — ${m.status}`,
			)
			.join("\n");
		return {
			content: [
				{
					type: "text",
					text: `${model_type} models: ${data.data.length}\n\n${summary || "No models"}`,
				},
			],
		};
	},
);

// --- Plugins ---

server.tool(
	"list_plugins",
	"List installed Dify plugins",
	{
		page: z.number().optional(),
		page_size: z.number().optional(),
	},
	async ({ page, page_size }) => {
		const data = await client.listPlugins(page ?? 1, page_size ?? 20);
		const summary = data.plugins
			.map(
				(p) =>
					`- ${p.label?.en_US || p.name} v${p.version} [${p.plugin_unique_identifier}] — ${p.enabled ? "enabled" : "disabled"}`,
			)
			.join("\n");
		return {
			content: [
				{ type: "text", text: `Plugins: ${data.total}\n\n${summary || "No plugins installed"}` },
			],
		};
	},
);

server.tool(
	"install_plugin",
	"Install a plugin from the Dify marketplace",
	{
		plugin_unique_identifier: z
			.string()
			.describe("Plugin identifier (e.g. author/plugin-name:1.0.0)"),
	},
	async ({ plugin_unique_identifier }) => {
		const result = await client.installPluginFromMarketplace([plugin_unique_identifier]);
		return {
			content: [
				{
					type: "text",
					text: `Installation started\nTask ID: ${result.task_id}\nPlugins: ${result.plugins?.join(", ") || plugin_unique_identifier}`,
				},
			],
		};
	},
);

server.tool(
	"uninstall_plugin",
	"Uninstall a plugin from Dify",
	{
		plugin_installation_id: z.string().describe("Plugin installation ID (from list_plugins)"),
	},
	async ({ plugin_installation_id }) => {
		const result = await client.uninstallPlugin(plugin_installation_id);
		return { content: [{ type: "text", text: `Uninstalled: ${result.result}` }] };
	},
);

server.tool(
	"upgrade_plugin",
	"Upgrade an installed plugin to a new version from the marketplace",
	{
		original_plugin_id: z.string().describe("Current plugin identifier (e.g. author/plugin:1.0.0)"),
		new_plugin_id: z.string().describe("New version identifier (e.g. author/plugin:2.0.0)"),
	},
	async ({ original_plugin_id, new_plugin_id }) => {
		const result = await client.upgradePluginFromMarketplace(original_plugin_id, new_plugin_id);
		return {
			content: [{ type: "text", text: `Upgrade started\nTask ID: ${result.task_id}` }],
		};
	},
);

server.tool(
	"get_plugin_task",
	"Check the status of a plugin install/upgrade task",
	{
		task_id: z.string().describe("Task ID from install_plugin or upgrade_plugin"),
	},
	async ({ task_id }) => {
		const task = await client.getPluginTask(task_id);
		return {
			content: [
				{
					type: "text",
					text: `Task: ${task.id}\nStatus: ${task.status}${task.message ? `\nMessage: ${task.message}` : ""}${task.plugin_unique_identifier ? `\nPlugin: ${task.plugin_unique_identifier}` : ""}`,
				},
			],
		};
	},
);

// --- Default Model ---

server.tool(
	"get_default_model",
	"Get the default model for a given type (llm, text-embedding, rerank, etc.)",
	{
		model_type: z
			.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
			.describe("Model type"),
	},
	async ({ model_type }) => {
		const result = await client.getDefaultModel(model_type);
		if (!result.data) {
			return { content: [{ type: "text", text: `No default ${model_type} model set` }] };
		}
		return {
			content: [
				{
					type: "text",
					text: `Default ${model_type}: ${result.data.model} (provider: ${result.data.provider})`,
				},
			],
		};
	},
);

server.tool(
	"set_default_model",
	"Set the default model for a given type",
	{
		model_type: z
			.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
			.describe("Model type"),
		provider: z.string().describe("Provider identifier (e.g. openai, anthropic)"),
		model: z.string().describe("Model identifier (e.g. gpt-4o, claude-sonnet-4-20250514)"),
	},
	async ({ model_type, provider, model }) => {
		const result = await client.setDefaultModel(model_type, provider, model);
		return {
			content: [{ type: "text", text: `Default ${model_type} set to ${model}: ${result.result}` }],
		};
	},
);

// --- App Details ---

server.tool(
	"get_app",
	"Get detailed information about a specific application",
	{
		app_id: z.string().describe("Application ID"),
	},
	async ({ app_id }) => {
		const app = await client.getApp(app_id);
		return {
			content: [
				{
					type: "text",
					text: `${app.name} (${app.mode})\nID: ${app.id}\nDescription: ${app.description || "none"}\nIcon: ${app.icon}\nCreated: ${new Date(app.created_at * 1000).toISOString()}`,
				},
			],
		};
	},
);

server.tool(
	"update_app",
	"Update an application's name, description, or icon",
	{
		app_id: z.string().describe("Application ID"),
		name: z.string().optional().describe("New name"),
		description: z.string().optional().describe("New description"),
		icon: z.string().optional().describe("New emoji icon"),
	},
	async ({ app_id, name, description, icon }) => {
		const app = await client.updateApp(app_id, name, description, icon);
		return {
			content: [{ type: "text", text: `Updated: ${app.name} (${app.mode}) [${app.id}]` }],
		};
	},
);

// --- MCP Servers ---

server.tool("list_mcp_servers", "List MCP servers configured in Dify", {}, async () => {
	const servers = await client.listMCPServers();
	const summary = servers
		.map((s) => `- ${s.name} [${s.id}] — ${s.server_url}\n  Tools: ${s.tools?.length || 0}`)
		.join("\n");
	return {
		content: [
			{
				type: "text",
				text: `MCP Servers: ${servers.length}\n\n${summary || "No MCP servers configured"}`,
			},
		],
	};
});

server.tool(
	"get_mcp_server_tools",
	"Get tools available on a specific MCP server in Dify",
	{
		provider_id: z.string().describe("MCP server provider ID"),
	},
	async ({ provider_id }) => {
		const server_info = await client.getMCPServerTools(provider_id);
		const tools = server_info.tools || [];
		const summary = tools
			.map((t) => `- ${t.name}: ${t.description || "no description"}`)
			.join("\n");
		return {
			content: [
				{
					type: "text",
					text: `Server: ${server_info.name} (${server_info.server_url})\nTools: ${tools.length}\n\n${summary || "No tools"}`,
				},
			],
		};
	},
);

server.tool(
	"create_mcp_server",
	"Add a new MCP server to Dify by URL",
	{
		name: z.string().describe("Display name for the MCP server"),
		server_url: z.string().describe("HTTP/SSE endpoint URL of the MCP server"),
		server_identifier: z
			.string()
			.describe("Unique identifier (lowercase, max 24 chars, e.g. my_mcp_server)"),
		icon: z.string().optional().describe("Emoji icon (default: 🔧)"),
		headers: z
			.string()
			.optional()
			.describe("JSON object of custom HTTP headers (e.g. Authorization)"),
	},
	async ({ name, server_url, server_identifier, icon, headers }) => {
		const parsedHeaders = headers ? JSON.parse(headers) : undefined;
		const result = await client.createMCPServer(
			name,
			server_url,
			server_identifier,
			icon,
			undefined,
			parsedHeaders,
		);
		const tools = result.tools || [];
		return {
			content: [
				{
					type: "text",
					text: `Created MCP server: ${result.name} [${result.id}]\nURL: ${result.server_url}\nTools discovered: ${tools.length}`,
				},
			],
		};
	},
);

server.tool(
	"update_mcp_server",
	"Update an existing MCP server in Dify",
	{
		provider_id: z.string().describe("MCP server provider ID"),
		name: z.string().describe("Updated display name"),
		server_url: z.string().describe("Updated HTTP/SSE endpoint URL"),
		server_identifier: z
			.string()
			.describe("Server identifier (cannot change after creation in some versions)"),
		icon: z.string().optional().describe("Emoji icon"),
		headers: z.string().optional().describe("JSON object of custom HTTP headers"),
	},
	async ({ provider_id, name, server_url, server_identifier, icon, headers }) => {
		const parsedHeaders = headers ? JSON.parse(headers) : undefined;
		const result = await client.updateMCPServer(
			provider_id,
			name,
			server_url,
			server_identifier,
			icon,
			undefined,
			parsedHeaders,
		);
		return {
			content: [
				{
					type: "text",
					text: `Updated MCP server: ${result.name} [${result.id}]\nURL: ${result.server_url}`,
				},
			],
		};
	},
);

server.tool(
	"delete_mcp_server",
	"Remove an MCP server from Dify",
	{
		provider_id: z.string().describe("MCP server provider ID"),
	},
	async ({ provider_id }) => {
		const result = await client.deleteMCPServer(provider_id);
		return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
	},
);

server.tool(
	"refresh_mcp_server_tools",
	"Re-fetch the tool list from an MCP server (use after the server adds/removes tools)",
	{
		provider_id: z.string().describe("MCP server provider ID"),
	},
	async ({ provider_id }) => {
		const result = await client.refreshMCPServerTools(provider_id);
		const tools = result.tools || [];
		return {
			content: [
				{
					type: "text",
					text: `Refreshed: ${result.name}\nTools: ${tools.length}\n${tools.map((t) => `- ${t.name}`).join("\n")}`,
				},
			],
		};
	},
);

// --- Tags ---

server.tool(
	"list_tags",
	"List tags for organizing apps or knowledge bases",
	{
		type: z.enum(["app", "knowledge"]).optional().describe("Filter by tag type"),
	},
	async ({ type }) => {
		const tags = await client.listTags(type);
		const summary = tags
			.map((t) => `- ${t.name} [${t.id}] (${t.type}, ${t.binding_count} bindings)`)
			.join("\n");
		return {
			content: [{ type: "text", text: `Tags: ${tags.length}\n\n${summary || "No tags"}` }],
		};
	},
);

server.tool(
	"create_tag",
	"Create a new tag for organizing apps or knowledge bases",
	{
		name: z.string().describe("Tag name (1-50 chars)"),
		tag_type: z.enum(["app", "knowledge"]).optional().describe("Tag type (default: app)"),
	},
	async ({ name, tag_type }) => {
		const tag = await client.createTag(name, tag_type ?? "app");
		return {
			content: [{ type: "text", text: `Created tag: ${tag.name} [${tag.id}] (${tag.type})` }],
		};
	},
);

server.tool(
	"delete_tag",
	"Delete a tag",
	{ tag_id: z.string().describe("Tag ID") },
	async ({ tag_id }) => {
		await client.deleteTag(tag_id);
		return { content: [{ type: "text", text: "Tag deleted" }] };
	},
);

server.tool(
	"bind_tag",
	"Bind one or more tags to an app or knowledge base",
	{
		tag_ids: z.array(z.string()).describe("Array of tag IDs to bind"),
		target_id: z.string().describe("App or dataset ID"),
		type: z.enum(["app", "knowledge"]).describe("Target type"),
	},
	async ({ tag_ids, target_id, type }) => {
		const result = await client.bindTag(tag_ids, target_id, type);
		return {
			content: [{ type: "text", text: `Bound ${tag_ids.length} tag(s): ${result.result}` }],
		};
	},
);

server.tool(
	"unbind_tag",
	"Remove a tag from an app or knowledge base",
	{
		tag_id: z.string().describe("Tag ID to remove"),
		target_id: z.string().describe("App or dataset ID"),
		type: z.enum(["app", "knowledge"]).describe("Target type"),
	},
	async ({ tag_id, target_id, type }) => {
		const result = await client.unbindTag(tag_id, target_id, type);
		return { content: [{ type: "text", text: `Unbound: ${result.result}` }] };
	},
);

// --- Conversations ---

server.tool(
	"list_conversations",
	"List conversations for a chat or completion app",
	{
		app_id: z.string().describe("Application ID"),
		page: z.number().optional(),
		limit: z.number().optional(),
	},
	async ({ app_id, page, limit }) => {
		const data = await client.listChatConversations(app_id, page ?? 1, limit ?? 20);
		const summary = data.data
			.map(
				(c) =>
					`- ${c.name || c.summary || "unnamed"} [${c.id}] — ${c.message_count ?? 0} msgs, ${c.from_source}`,
			)
			.join("\n");
		return {
			content: [
				{ type: "text", text: `Conversations: ${data.total}\n\n${summary || "No conversations"}` },
			],
		};
	},
);

server.tool(
	"delete_conversation",
	"Delete a conversation from an app",
	{
		app_id: z.string().describe("Application ID"),
		conversation_id: z.string().describe("Conversation ID"),
	},
	async ({ app_id, conversation_id }) => {
		const result = await client.deleteChatConversation(app_id, conversation_id);
		return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
	},
);

// --- Messages ---

server.tool(
	"list_messages",
	"List messages in a conversation",
	{
		app_id: z.string().describe("Application ID"),
		conversation_id: z.string().describe("Conversation ID"),
		limit: z.number().optional().describe("Number of messages (default 20, max 100)"),
		first_id: z.string().optional().describe("Cursor: oldest message ID from previous page"),
	},
	async ({ app_id, conversation_id, limit, first_id }) => {
		const data = await client.listChatMessages(app_id, conversation_id, limit ?? 20, first_id);
		const summary = data.data
			.map(
				(m) =>
					`[${m.id}] Q: ${m.query.substring(0, 60)}${m.query.length > 60 ? "..." : ""}\nA: ${m.answer.substring(0, 80)}${m.answer.length > 80 ? "..." : ""} (${m.answer_tokens} tokens)`,
			)
			.join("\n\n");
		return {
			content: [
				{
					type: "text",
					text: `Messages: ${data.data.length}${data.has_more ? " (has more)" : ""}\n\n${summary || "No messages"}`,
				},
			],
		};
	},
);

server.tool(
	"get_message",
	"Get a single message with full details",
	{
		app_id: z.string().describe("Application ID"),
		message_id: z.string().describe("Message ID"),
	},
	async ({ app_id, message_id }) => {
		const m = await client.getMessage(app_id, message_id);
		return {
			content: [
				{
					type: "text",
					text: `Message: ${m.id}\nStatus: ${m.status}\nQuery: ${m.query}\nAnswer: ${m.answer}\nTokens: ${m.message_tokens} in / ${m.answer_tokens} out\nLatency: ${m.provider_response_latency}s\nSource: ${m.from_source}\nCreated: ${new Date(m.created_at * 1000).toISOString()}`,
				},
			],
		};
	},
);

// --- Start ---

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Dify MCP Server v0.7.0 running on stdio");
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});
