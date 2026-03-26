/**
 * Dify Console API client.
 * Password is Base64-encoded (Dify's @decrypt_password_field decorator).
 * Auth via cookies (access_token, refresh_token, csrf_token) since Dify 1.9.2+.
 */

interface LoginResponse {
	result: string;
	data?: string;
}

interface App {
	id: string;
	name: string;
	mode: string;
	description: string;
	created_at: number;
	updated_at: number;
	icon: string;
	icon_background: string;
}

interface AppListResponse {
	data: App[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

interface ImportResponse {
	id: string;
	status: string;
	app_id?: string;
}

interface Workflow {
	id: string;
	graph: Record<string, unknown>;
	features: Record<string, unknown>;
	hash: string;
	created_at: string;
	updated_at: string;
}

export class DifyClient {
	private baseUrl: string;
	private cookies: Map<string, string> = new Map();
	private csrfToken: string | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	private parseCookies(res: Response): void {
		const setCookieHeaders = res.headers.getSetCookie?.() ?? [];
		for (const header of setCookieHeaders) {
			const match = header.match(/^([^=]+)=([^;]*)/);
			if (match) {
				this.cookies.set(match[1], match[2]);
				if (match[1].endsWith("csrf_token")) {
					this.csrfToken = match[2];
				}
			}
		}
	}

	private getCookieHeader(): string {
		return Array.from(this.cookies.entries())
			.map(([k, v]) => `${k}=${v}`)
			.join("; ");
	}

	private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
		if (this.cookies.size === 0 && !path.includes("/login")) {
			throw new Error("Not authenticated. Call login() first.");
		}

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...(options.headers as Record<string, string>),
		};

		if (this.cookies.size > 0) {
			headers.Cookie = this.getCookieHeader();
		}

		if (this.csrfToken && options.method && options.method !== "GET") {
			headers["X-CSRF-Token"] = this.csrfToken;
		}

		const res = await fetch(`${this.baseUrl}/console/api${path}`, {
			...options,
			headers,
			redirect: "manual",
		});

		this.parseCookies(res);

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`Dify API ${res.status}: ${body}`);
		}

		return res.json() as Promise<T>;
	}

	async login(email: string, password: string): Promise<string> {
		const passwordB64 = Buffer.from(password).toString("base64");

		const data = await this.request<LoginResponse>("/login", {
			method: "POST",
			body: JSON.stringify({
				email,
				password: passwordB64,
				language: "en-US",
				remember_me: true,
			}),
		});

		const hasAccessToken = Array.from(this.cookies.keys()).some((k) => k.endsWith("access_token"));
		if (data.result === "success" || hasAccessToken) {
			return "Login successful";
		}

		throw new Error(`Login failed: ${JSON.stringify(data)}`);
	}

	async listApps(page = 1, limit = 30): Promise<AppListResponse> {
		return this.request<AppListResponse>(`/apps?page=${page}&limit=${limit}`);
	}

	async createApp(
		name: string,
		mode: "chat" | "agent-chat" | "advanced-chat" | "workflow" | "completion",
		description = "",
		icon = "\u{1F916}",
		iconBackground = "#FFEAD5",
	): Promise<App> {
		return this.request<App>("/apps", {
			method: "POST",
			body: JSON.stringify({
				name,
				mode,
				description,
				icon_type: "emoji",
				icon,
				icon_background: iconBackground,
			}),
		});
	}

	async deleteApp(appId: string): Promise<{ result: string }> {
		return this.request<{ result: string }>(`/apps/${appId}`, {
			method: "DELETE",
		});
	}

	async importDSL(
		yamlContent: string,
		name?: string,
		description?: string,
	): Promise<ImportResponse> {
		const body: Record<string, string> = {
			mode: "yaml-content",
			yaml_content: yamlContent,
		};
		if (name) body.name = name;
		if (description) body.description = description;

		return this.request<ImportResponse>("/apps/imports", {
			method: "POST",
			body: JSON.stringify(body),
		});
	}

	async confirmImport(importId: string): Promise<ImportResponse> {
		return this.request<ImportResponse>(`/apps/imports/${importId}/confirm`, {
			method: "POST",
		});
	}

	async exportApp(appId: string): Promise<{ data: string }> {
		return this.request<{ data: string }>(`/apps/${appId}/export`);
	}

	async getWorkflowDraft(appId: string): Promise<Workflow> {
		return this.request<Workflow>(`/apps/${appId}/workflows/draft`);
	}

	async updateWorkflowDraft(
		appId: string,
		graph: Record<string, unknown>,
		features: Record<string, unknown>,
		hash: string,
	): Promise<{ result: string }> {
		return this.request<{ result: string }>(`/apps/${appId}/workflows/draft`, {
			method: "POST",
			body: JSON.stringify({ graph, features, hash }),
		});
	}

	async publishWorkflow(appId: string): Promise<{ result: string }> {
		return this.request<{ result: string }>(`/apps/${appId}/workflows/publish`, {
			method: "POST",
		});
	}

	async enableApi(appId: string): Promise<{ result: string }> {
		return this.request<{ result: string }>(`/apps/${appId}/api-enable`, {
			method: "POST",
		});
	}

	async enableSite(appId: string): Promise<{ result: string }> {
		return this.request<{ result: string }>(`/apps/${appId}/site-enable`, {
			method: "POST",
		});
	}

	async copyApp(appId: string, name?: string): Promise<App> {
		const body: Record<string, string> = {};
		if (name) body.name = name;
		return this.request<App>(`/apps/${appId}/copy`, {
			method: "POST",
			body: JSON.stringify(body),
		});
	}

	async getAppApiKeys(
		appId: string,
	): Promise<{ data: Array<{ id: string; token: string; created_at: number }> }> {
		return this.request<{ data: Array<{ id: string; token: string; created_at: number }> }>(
			`/apps/${appId}/api-keys`,
		);
	}

	async createAppApiKey(appId: string): Promise<{ id: string; token: string; created_at: number }> {
		return this.request<{ id: string; token: string; created_at: number }>(
			`/apps/${appId}/api-keys`,
			{ method: "POST" },
		);
	}
}
