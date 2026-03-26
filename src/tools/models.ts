import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerModelTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_model_providers",
		{
			description:
				"List all configured model providers (OpenAI, Anthropic, etc.) with their status",
			inputSchema: {
				model_type: z
					.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
					.optional()
					.describe("Filter by model type"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ model_type }) => {
			try {
				const data = await client.listModelProviders(model_type);
				const summary = data.data
					.map(
						(p) =>
							`- ${p.label.en_US || p.provider} [${p.provider}] — ${p.custom_configuration?.status || "not configured"} (types: ${p.supported_model_types.join(", ")})`,
					)
					.join("\n");
				return {
					content: [
						{
							type: "text",
							text: `Providers: ${data.data.length}\n\n${summary || "No providers"}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"list_models",
		{
			description: "List models for a specific provider",
			inputSchema: {
				provider: z.string().describe("Provider identifier (e.g. openai, anthropic, azure_openai)"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ provider }) => {
			try {
				const data = await client.listProviderModels(provider);
				const summary = data.data
					.map((m) => `- ${m.label.en_US || m.model} [${m.model}] — ${m.status} (${m.model_type})`)
					.join("\n");
				return {
					content: [
						{ type: "text", text: `Models: ${data.data.length}\n\n${summary || "No models"}` },
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"list_models_by_type",
		{
			description:
				"List all available models across all providers for a given type (e.g. all LLMs)",
			inputSchema: {
				model_type: z
					.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
					.describe("Model type to list"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ model_type }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"get_default_model",
		{
			description: "Get the default model for a given type (llm, text-embedding, rerank, etc.)",
			inputSchema: {
				model_type: z
					.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
					.describe("Model type"),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ model_type }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"set_default_model",
		{
			description: "Set the default model for a given type",
			inputSchema: {
				model_type: z
					.enum(["llm", "text-embedding", "rerank", "speech2text", "moderation", "tts"])
					.describe("Model type"),
				provider: z.string().describe("Provider identifier (e.g. openai, anthropic)"),
				model: z.string().describe("Model identifier (e.g. gpt-4o, claude-sonnet-4-20250514)"),
			},
			annotations: { idempotentHint: true },
		},
		async ({ model_type, provider, model }) => {
			try {
				const result = await client.setDefaultModel(model_type, provider, model);
				return {
					content: [
						{ type: "text", text: `Default ${model_type} set to ${model}: ${result.result}` },
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
