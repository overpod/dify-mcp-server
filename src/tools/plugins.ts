import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerPluginTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_plugins",
		{
			description: "List installed Dify plugins",
			inputSchema: {
				page: z.number().optional(),
				page_size: z.number().optional(),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ page, page_size }) => {
			try {
				const data = await client.listPlugins(page ?? 1, page_size ?? 20);
				const summary = data.plugins
					.map(
						(p) =>
							`- ${p.label?.en_US || p.name} v${p.version} [${p.plugin_unique_identifier}] — ${p.enabled ? "enabled" : "disabled"}`,
					)
					.join("\n");
				return {
					content: [
						{
							type: "text",
							text: `Plugins: ${data.total}\n\n${summary || "No plugins installed"}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"install_plugin",
		{
			description: "Install a plugin from the Dify marketplace",
			inputSchema: {
				plugin_unique_identifier: z
					.string()
					.describe("Plugin identifier (e.g. author/plugin-name:1.0.0)"),
			},
		},
		async ({ plugin_unique_identifier }) => {
			try {
				const result = await client.installPluginFromMarketplace([plugin_unique_identifier]);
				return {
					content: [
						{
							type: "text",
							text: `Installation started\nTask ID: ${result.task_id}\nPlugins: ${result.plugins?.join(", ") || plugin_unique_identifier}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"uninstall_plugin",
		{
			description: "Uninstall a plugin from Dify",
			inputSchema: {
				plugin_installation_id: z.string().describe("Plugin installation ID (from list_plugins)"),
			},
			annotations: { destructiveHint: true },
		},
		async ({ plugin_installation_id }) => {
			try {
				const result = await client.uninstallPlugin(plugin_installation_id);
				return { content: [{ type: "text", text: `Uninstalled: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"upgrade_plugin",
		{
			description: "Upgrade an installed plugin to a new version from the marketplace",
			inputSchema: {
				original_plugin_id: z
					.string()
					.describe("Current plugin identifier (e.g. author/plugin:1.0.0)"),
				new_plugin_id: z.string().describe("New version identifier (e.g. author/plugin:2.0.0)"),
			},
		},
		async ({ original_plugin_id, new_plugin_id }) => {
			try {
				const result = await client.upgradePluginFromMarketplace(original_plugin_id, new_plugin_id);
				return {
					content: [{ type: "text", text: `Upgrade started\nTask ID: ${result.task_id}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_plugin_task",
		{
			description: "Check the status of a plugin install/upgrade task",
			inputSchema: {
				task_id: z.string().describe("Task ID from install_plugin or upgrade_plugin"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ task_id }) => {
			try {
				const task = await client.getPluginTask(task_id);
				return {
					content: [
						{
							type: "text",
							text: `Task: ${task.id}\nStatus: ${task.status}${task.message ? `\nMessage: ${task.message}` : ""}${task.plugin_unique_identifier ? `\nPlugin: ${task.plugin_unique_identifier}` : ""}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
