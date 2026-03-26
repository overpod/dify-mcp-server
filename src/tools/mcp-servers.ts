import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerMcpServerTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_mcp_servers",
		{
			description: "List MCP servers configured in Dify",
			annotations: { readOnlyHint: true },
		},
		async () => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_mcp_server_tools",
		{
			description: "Get tools available on a specific MCP server in Dify",
			inputSchema: {
				provider_id: z.string().describe("MCP server provider ID"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ provider_id }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_mcp_server",
		{
			description: "Add a new MCP server to Dify by URL",
			inputSchema: {
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
		},
		async ({ name, server_url, server_identifier, icon, headers }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"update_mcp_server",
		{
			description: "Update an existing MCP server in Dify",
			inputSchema: {
				provider_id: z.string().describe("MCP server provider ID"),
				name: z.string().describe("Updated display name"),
				server_url: z.string().describe("Updated HTTP/SSE endpoint URL"),
				server_identifier: z
					.string()
					.describe("Server identifier (cannot change after creation in some versions)"),
				icon: z.string().optional().describe("Emoji icon"),
				headers: z.string().optional().describe("JSON object of custom HTTP headers"),
			},
			annotations: { idempotentHint: true },
		},
		async ({ provider_id, name, server_url, server_identifier, icon, headers }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_mcp_server",
		{
			description: "Remove an MCP server from Dify",
			inputSchema: {
				provider_id: z.string().describe("MCP server provider ID"),
			},
			annotations: { destructiveHint: true },
		},
		async ({ provider_id }) => {
			try {
				const result = await client.deleteMCPServer(provider_id);
				return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"refresh_mcp_server_tools",
		{
			description:
				"Re-fetch the tool list from an MCP server (use after the server adds/removes tools)",
			inputSchema: {
				provider_id: z.string().describe("MCP server provider ID"),
			},
		},
		async ({ provider_id }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
