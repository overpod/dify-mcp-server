import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerAppTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_apps",
		{
			description: "List all Dify applications",
			inputSchema: { page: z.number().optional(), limit: z.number().optional() },
			annotations: { readOnlyHint: true },
		},
		async ({ page, limit }) => {
			try {
				const data = await client.listApps(page ?? 1, limit ?? 30);
				const summary = data.data.map((a) => `- ${a.name} (${a.mode}) [${a.id}]`).join("\n");
				return {
					content: [{ type: "text", text: `Total: ${data.total}\n\n${summary}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_app",
		{
			description:
				"Create a new Dify application (chat, agent-chat, advanced-chat, workflow, completion)",
			inputSchema: {
				name: z.string().describe("Application name"),
				mode: z
					.enum(["chat", "agent-chat", "advanced-chat", "workflow", "completion"])
					.describe("Application type"),
				description: z.string().optional().describe("Application description"),
			},
		},
		async ({ name, mode, description }) => {
			try {
				const app = await client.createApp(name, mode, description);
				return {
					content: [{ type: "text", text: `Created: ${app.name} (${app.mode})\nID: ${app.id}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_app",
		{
			description: "Delete a Dify application by ID",
			inputSchema: { app_id: z.string().describe("Application ID") },
			annotations: { destructiveHint: true },
		},
		async ({ app_id }) => {
			try {
				const result = await client.deleteApp(app_id);
				return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"copy_app",
		{
			description: "Duplicate an existing Dify application",
			inputSchema: {
				app_id: z.string().describe("Source application ID"),
				name: z.string().optional().describe("New name for the copy"),
			},
		},
		async ({ app_id, name }) => {
			try {
				const app = await client.copyApp(app_id, name);
				return {
					content: [{ type: "text", text: `Copied: ${app.name} (${app.mode})\nNew ID: ${app.id}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_app",
		{
			description: "Get detailed information about a specific application",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ app_id }) => {
			try {
				const app = await client.getApp(app_id);
				return {
					content: [
						{
							type: "text",
							text: `${app.name} (${app.mode})\nID: ${app.id}\nDescription: ${app.description || "none"}\nIcon: ${app.icon}\nCreated: ${new Date(app.created_at * 1000).toISOString()}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"update_app",
		{
			description: "Update an application's name, description, or icon",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
				name: z.string().optional().describe("New name"),
				description: z.string().optional().describe("New description"),
				icon: z.string().optional().describe("New emoji icon"),
			},
			annotations: { idempotentHint: true },
		},
		async ({ app_id, name, description, icon }) => {
			try {
				const app = await client.updateApp(app_id, name, description, icon);
				return {
					content: [{ type: "text", text: `Updated: ${app.name} (${app.mode}) [${app.id}]` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"import_dsl",
		{
			description: "Import a Dify application from YAML DSL content",
			inputSchema: {
				yaml_content: z.string().describe("YAML DSL content defining the application"),
				name: z.string().optional().describe("Override application name"),
				description: z.string().optional().describe("Override description"),
			},
		},
		async ({ yaml_content, name, description }) => {
			try {
				const result = await client.importDSL(yaml_content, name, description);
				let text = `Import status: ${result.status}\nApp ID: ${result.app_id || result.id}`;
				if (result.status === "pending") {
					const confirmed = await client.confirmImport(result.id);
					text += `\nConfirmed: ${confirmed.status}, App ID: ${confirmed.app_id}`;
				}
				return { content: [{ type: "text", text }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"export_app",
		{
			description: "Export a Dify application as YAML DSL",
			inputSchema: { app_id: z.string().describe("Application ID to export") },
			annotations: { readOnlyHint: true },
		},
		async ({ app_id }) => {
			try {
				const result = await client.exportApp(app_id);
				return { content: [{ type: "text", text: result.data }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"enable_api",
		{
			description: "Enable API access for an application",
			inputSchema: { app_id: z.string().describe("Application ID") },
			annotations: { idempotentHint: true },
		},
		async ({ app_id }) => {
			try {
				const result = await client.enableApi(app_id);
				return { content: [{ type: "text", text: `API enabled: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"enable_site",
		{
			description: "Enable web site (chat UI) access for an application",
			inputSchema: { app_id: z.string().describe("Application ID") },
			annotations: { idempotentHint: true },
		},
		async ({ app_id }) => {
			try {
				const result = await client.enableSite(app_id);
				return { content: [{ type: "text", text: `Site enabled: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_api_keys",
		{
			description: "Get API keys for an application",
			inputSchema: { app_id: z.string().describe("Application ID") },
			annotations: { readOnlyHint: true },
		},
		async ({ app_id }) => {
			try {
				const data = await client.getAppApiKeys(app_id);
				const keys = data.data.map((k) => `- ${k.token} (${k.id})`).join("\n");
				return { content: [{ type: "text", text: keys || "No API keys found" }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_api_key",
		{
			description: "Create a new API key for an application",
			inputSchema: { app_id: z.string().describe("Application ID") },
		},
		async ({ app_id }) => {
			try {
				const key = await client.createAppApiKey(app_id);
				return { content: [{ type: "text", text: `API Key: ${key.token}\nID: ${key.id}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
