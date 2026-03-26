import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerConversationTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_conversations",
		{
			description: "List conversations for a chat or completion app",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
				page: z.number().optional(),
				limit: z.number().optional(),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ app_id, page, limit }) => {
			try {
				const data = await client.listChatConversations(app_id, page ?? 1, limit ?? 20);
				const summary = data.data
					.map(
						(c) =>
							`- ${c.name || c.summary || "unnamed"} [${c.id}] — ${c.message_count ?? 0} msgs, ${c.from_source}`,
					)
					.join("\n");
				return {
					content: [
						{
							type: "text",
							text: `Conversations: ${data.total}\n\n${summary || "No conversations"}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_conversation",
		{
			description: "Delete a conversation from an app",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
				conversation_id: z.string().describe("Conversation ID"),
			},
			annotations: { destructiveHint: true },
		},
		async ({ app_id, conversation_id }) => {
			try {
				const result = await client.deleteChatConversation(app_id, conversation_id);
				return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"list_messages",
		{
			description: "List messages in a conversation",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
				conversation_id: z.string().describe("Conversation ID"),
				limit: z.number().optional().describe("Number of messages (default 20, max 100)"),
				first_id: z.string().optional().describe("Cursor: oldest message ID from previous page"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ app_id, conversation_id, limit, first_id }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_message",
		{
			description: "Get a single message with full details",
			inputSchema: {
				app_id: z.string().describe("Application ID"),
				message_id: z.string().describe("Message ID"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ app_id, message_id }) => {
			try {
				const m = await client.getMessage(app_id, message_id);
				return {
					content: [
						{
							type: "text",
							text: `Message: ${m.id}\nStatus: ${m.status}\nQuery: ${m.query}\nAnswer: ${m.answer}\nTokens: ${m.message_tokens} in / ${m.answer_tokens} out\nLatency: ${m.provider_response_latency}s\nSource: ${m.from_source}\nCreated: ${new Date(m.created_at * 1000).toISOString()}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
