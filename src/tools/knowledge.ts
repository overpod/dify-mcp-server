import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DifyClient } from "../dify-client.js";

export const registerKnowledgeTools = (server: McpServer, client: DifyClient) => {
	server.registerTool(
		"list_datasets",
		{
			description: "List all knowledge base datasets",
			inputSchema: { page: z.number().optional(), limit: z.number().optional() },
			annotations: { readOnlyHint: true },
		},
		async ({ page, limit }) => {
			try {
				const data = await client.listDatasets(page ?? 1, limit ?? 30);
				const summary = data.data
					.map((d) => `- ${d.name} (${d.document_count} docs, ${d.word_count} words) [${d.id}]`)
					.join("\n");
				return {
					content: [{ type: "text", text: `Total: ${data.total}\n\n${summary || "No datasets"}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_dataset",
		{
			description: "Create a new knowledge base dataset",
			inputSchema: {
				name: z.string().describe("Dataset name"),
				description: z.string().optional().describe("Dataset description"),
				indexing_technique: z
					.enum(["high_quality", "economy"])
					.optional()
					.describe("Indexing technique (default: high_quality)"),
			},
		},
		async ({ name, description, indexing_technique }) => {
			try {
				const ds = await client.createDataset(
					name,
					description,
					indexing_technique ?? "high_quality",
				);
				return {
					content: [{ type: "text", text: `Created dataset: ${ds.name}\nID: ${ds.id}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_dataset",
		{
			description: "Delete a knowledge base dataset",
			inputSchema: { dataset_id: z.string().describe("Dataset ID") },
			annotations: { destructiveHint: true },
		},
		async ({ dataset_id }) => {
			try {
				await client.deleteDataset(dataset_id);
				return { content: [{ type: "text", text: "Dataset deleted" }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"list_documents",
		{
			description: "List documents in a knowledge base dataset",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				page: z.number().optional(),
				limit: z.number().optional(),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ dataset_id, page, limit }) => {
			try {
				const data = await client.listDocuments(dataset_id, page ?? 1, limit ?? 30);
				const summary = data.data
					.map((d) => `- ${d.name} (${d.word_count} words, ${d.indexing_status}) [${d.id}]`)
					.join("\n");
				return {
					content: [{ type: "text", text: `Total: ${data.total}\n\n${summary || "No documents"}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_document_by_text",
		{
			description: "Add a text document to a knowledge base dataset",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				name: z.string().describe("Document name"),
				text: z.string().describe("Document text content"),
			},
		},
		async ({ dataset_id, name, text }) => {
			try {
				const result = await client.createDocumentByText(dataset_id, name, text);
				return {
					content: [
						{
							type: "text",
							text: `Document created: ${result.document.name}\nID: ${result.document.id}\nBatch: ${result.batch}`,
						},
					],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_document",
		{
			description: "Delete a document from a knowledge base dataset",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				document_id: z.string().describe("Document ID"),
			},
			annotations: { destructiveHint: true },
		},
		async ({ dataset_id, document_id }) => {
			try {
				const result = await client.deleteDocument(dataset_id, document_id);
				return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"list_segments",
		{
			description: "List segments (chunks) of a document",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				document_id: z.string().describe("Document ID"),
				page: z.number().optional(),
				limit: z.number().optional(),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ dataset_id, document_id, page, limit }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"create_segment",
		{
			description: "Add a segment (chunk) to a document",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				document_id: z.string().describe("Document ID"),
				content: z.string().describe("Segment text content"),
				answer: z.string().optional().describe("Segment answer (for Q&A datasets)"),
				keywords: z.array(z.string()).optional().describe("Keywords for the segment"),
			},
		},
		async ({ dataset_id, document_id, content, answer, keywords }) => {
			try {
				const result = await client.createSegment(
					dataset_id,
					document_id,
					content,
					answer,
					keywords,
				);
				return {
					content: [{ type: "text", text: `Segment created: ${result.data.id}` }],
				};
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"update_segment",
		{
			description: "Update a segment (chunk) in a document",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				document_id: z.string().describe("Document ID"),
				segment_id: z.string().describe("Segment ID"),
				content: z.string().describe("Updated text content"),
				answer: z.string().optional().describe("Updated answer"),
				keywords: z.array(z.string()).optional().describe("Updated keywords"),
			},
			annotations: { idempotentHint: true },
		},
		async ({ dataset_id, document_id, segment_id, content, answer, keywords }) => {
			try {
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
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);

	server.registerTool(
		"delete_segment",
		{
			description: "Delete a segment (chunk) from a document",
			inputSchema: {
				dataset_id: z.string().describe("Dataset ID"),
				document_id: z.string().describe("Document ID"),
				segment_id: z.string().describe("Segment ID"),
			},
			annotations: { destructiveHint: true },
		},
		async ({ dataset_id, document_id, segment_id }) => {
			try {
				const result = await client.deleteSegment(dataset_id, document_id, segment_id);
				return { content: [{ type: "text", text: `Deleted: ${result.result}` }] };
			} catch (e) {
				return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
			}
		},
	);
};
