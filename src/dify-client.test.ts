import { beforeEach, describe, expect, it, vi } from "vitest";
import { DifyClient } from "./dify-client.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200, cookies: string[] = []) {
	const headers = new Headers();
	return {
		ok: status >= 200 && status < 300,
		status,
		headers: {
			...headers,
			getSetCookie: () => cookies,
		},
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	} as unknown as Response;
}

describe("DifyClient", () => {
	let client: DifyClient;

	beforeEach(() => {
		vi.clearAllMocks();
		client = new DifyClient("https://dify.example.com", "admin@test.com", "secret123");
	});

	describe("login", () => {
		it("sends Base64-encoded password", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok123; Path=/",
					"__Host-csrf_token=csrf456; Path=/",
				]),
			);

			await client.login();

			const [url, opts] = mockFetch.mock.calls[0];
			expect(url).toBe("https://dify.example.com/console/api/login");
			const body = JSON.parse(opts.body);
			expect(body.password).toBe(Buffer.from("secret123").toString("base64"));
			expect(body.email).toBe("admin@test.com");
		});

		it("parses cookies from response", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=mytoken; Path=/; HttpOnly",
					"__Host-csrf_token=mycsrf; Path=/; HttpOnly",
				]),
			);

			await client.login();

			// Next request should include cookies and CSRF
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ data: [], has_more: false, total: 0, page: 1, limit: 30 }),
			);
			await client.listApps();

			const [, opts] = mockFetch.mock.calls[1];
			expect(opts.headers.Cookie).toContain("__Host-access_token=mytoken");
			expect(opts.headers["X-CSRF-Token"]).toBe("mycsrf");
		});

		it("throws on failed login", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ result: "fail", message: "bad creds" }, 401));

			await expect(client.login()).rejects.toThrow("Dify API 401");
		});
	});

	describe("auto-login", () => {
		it("logs in automatically on first request", async () => {
			// First call = login
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
			// Second call = actual request
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ data: [], has_more: false, total: 0, page: 1, limit: 30 }),
			);

			const result = await client.listApps();

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result.total).toBe(0);
		});

		it("retries on 401 (expired token)", async () => {
			// Login
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok1; Path=/",
					"__Host-csrf_token=csrf1; Path=/",
				]),
			);
			// First attempt = 401
			mockFetch.mockResolvedValueOnce(jsonResponse({ message: "unauthorized" }, 401));
			// Re-login
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok2; Path=/",
					"__Host-csrf_token=csrf2; Path=/",
				]),
			);
			// Retry = success
			mockFetch.mockResolvedValueOnce(
				jsonResponse({
					data: [{ id: "app1", name: "Test", mode: "chat" }],
					has_more: false,
					total: 1,
					page: 1,
					limit: 30,
				}),
			);

			const result = await client.listApps();

			expect(mockFetch).toHaveBeenCalledTimes(4);
			expect(result.total).toBe(1);
		});
	});

	describe("apps", () => {
		beforeEach(async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
		});

		it("creates an app with correct params", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ id: "new-app", name: "My Agent", mode: "agent-chat" }),
			);

			const app = await client.createApp("My Agent", "agent-chat", "A test agent");

			const [url, opts] = mockFetch.mock.calls[1];
			expect(url).toBe("https://dify.example.com/console/api/apps");
			expect(opts.method).toBe("POST");
			const body = JSON.parse(opts.body);
			expect(body.name).toBe("My Agent");
			expect(body.mode).toBe("agent-chat");
			expect(app.id).toBe("new-app");
		});

		it("deletes an app", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ result: "success" }));

			const result = await client.deleteApp("app-123");

			const [url, opts] = mockFetch.mock.calls[1];
			expect(url).toBe("https://dify.example.com/console/api/apps/app-123");
			expect(opts.method).toBe("DELETE");
			expect(result.result).toBe("success");
		});
	});

	describe("knowledge base", () => {
		beforeEach(async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
		});

		it("creates a dataset", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ id: "ds-1", name: "Test KB", indexing_technique: "high_quality" }),
			);

			const ds = await client.createDataset("Test KB", "desc", "high_quality");

			const body = JSON.parse(mockFetch.mock.calls[1][1].body);
			expect(body.name).toBe("Test KB");
			expect(body.indexing_technique).toBe("high_quality");
			expect(ds.id).toBe("ds-1");
		});

		it("creates a segment with keywords", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ data: { id: "seg-1", content: "hello", keywords: ["test"] } }),
			);

			const result = await client.createSegment("ds-1", "doc-1", "hello", "world", ["test"]);

			const body = JSON.parse(mockFetch.mock.calls[1][1].body);
			expect(body.segments[0].content).toBe("hello");
			expect(body.segments[0].keywords).toEqual(["test"]);
			expect(result.data.id).toBe("seg-1");
		});
	});

	describe("MCP servers", () => {
		beforeEach(async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
		});

		it("creates an MCP server with correct payload", async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({
					id: "mcp-1",
					name: "My Server",
					server_url: "https://mcp.test/sse",
					tools: [],
				}),
			);

			await client.createMCPServer("My Server", "https://mcp.test/sse", "my_server");

			const body = JSON.parse(mockFetch.mock.calls[1][1].body);
			expect(body.name).toBe("My Server");
			expect(body.server_url).toBe("https://mcp.test/sse");
			expect(body.server_identifier).toBe("my_server");
			expect(body.configuration.timeout).toBe(30);
		});

		it("deletes an MCP server", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ result: "success" }));

			await client.deleteMCPServer("mcp-1");

			const [url, opts] = mockFetch.mock.calls[1];
			expect(url).toBe("https://dify.example.com/console/api/workspaces/current/tool-provider/mcp");
			expect(opts.method).toBe("DELETE");
			const body = JSON.parse(opts.body);
			expect(body.provider_id).toBe("mcp-1");
		});
	});

	describe("tags", () => {
		beforeEach(async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
		});

		it("binds tags to an app", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ result: "success" }));

			await client.bindTag(["tag-1", "tag-2"], "app-1", "app");

			const body = JSON.parse(mockFetch.mock.calls[1][1].body);
			expect(body.tag_ids).toEqual(["tag-1", "tag-2"]);
			expect(body.target_id).toBe("app-1");
			expect(body.type).toBe("app");
		});
	});

	describe("URL construction", () => {
		beforeEach(async () => {
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
		});

		it("strips trailing slash from base URL", async () => {
			const c = new DifyClient("https://dify.example.com/", "a@b.com", "pw");
			// Login
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ result: "success" }, 200, [
					"__Host-access_token=tok; Path=/",
					"__Host-csrf_token=csrf; Path=/",
				]),
			);
			mockFetch.mockResolvedValueOnce(
				jsonResponse({ data: [], has_more: false, total: 0, page: 1, limit: 30 }),
			);

			await c.listApps();

			// The actual request (not login) should have clean URL
			const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
			expect(lastCall[0]).toBe("https://dify.example.com/console/api/apps?page=1&limit=30");
		});
	});
});
