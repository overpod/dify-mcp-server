import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerTagTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_tags",
		{
			description: "List tags for organizing apps or knowledge bases",
			inputSchema: {
				type: z.enum(["app", "knowledge"]).optional().describe("Filter by tag type"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ type }) => {
			try {
				const tags = await client.listTags(type);
				const summary = tags
					.map((t) => `- ${t.name} [${t.id}] (${t.type}, ${t.binding_count} bindings)`)
					.join("\n");
				return {
					content: [{ type: "text", text: `Tags: ${tags.length}\n\n${summary || "No tags"}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_tag",
		{
			description: "Create a new tag for organizing apps or knowledge bases",
			inputSchema: {
				name: z.string().describe("Tag name (1-50 chars)"),
				tag_type: z.enum(["app", "knowledge"]).optional().describe("Tag type (default: app)"),
			},
		},
		async ({ name, tag_type }) => {
			try {
				const tag = await client.createTag(name, tag_type ?? "app");
				return {
					content: [{ type: "text", text: `Created tag: ${tag.name} [${tag.id}] (${tag.type})` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_tag",
		{
			description: "Delete a tag",
			inputSchema: { tag_id: z.string().describe("Tag ID") },
			annotations: { destructiveHint: true },
		},
		async ({ tag_id }) => {
			try {
				await client.deleteTag(tag_id);
				return { content: [{ type: "text", text: "Tag deleted" }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"bind_tag",
		{
			description: "Bind one or more tags to an app or knowledge base",
			inputSchema: {
				tag_ids: z.array(z.string()).describe("Array of tag IDs to bind"),
				target_id: z.string().describe("App or dataset ID"),
				type: z.enum(["app", "knowledge"]).describe("Target type"),
			},
			annotations: { idempotentHint: true },
		},
		async ({ tag_ids, target_id, type }) => {
			try {
				const result = await client.bindTag(tag_ids, target_id, type);
				return {
					content: [{ type: "text", text: `Bound ${tag_ids.length} tag(s): ${result.result}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"unbind_tag",
		{
			description: "Remove a tag from an app or knowledge base",
			inputSchema: {
				tag_id: z.string().describe("Tag ID to remove"),
				target_id: z.string().describe("App or dataset ID"),
				type: z.enum(["app", "knowledge"]).describe("Target type"),
			},
		},
		async ({ tag_id, target_id, type }) => {
			try {
				const result = await client.unbindTag(tag_id, target_id, type);
				return { content: [{ type: "text", text: `Unbound: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
