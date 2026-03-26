export interface LoginResponse {
	result: string;
	data?: string;
}

export interface ModelProvider {
	provider: string;
	label: Record<string, string>;
	supported_model_types: string[];
	configurate_methods: string[];
	preferred_provider_type: string;
	custom_configuration: { status: string };
	system_configuration: { enabled: boolean };
}

export interface Model {
	model: string;
	model_type: string;
	label: Record<string, string>;
	status: string;
	fetch_from: string;
	provider?: string;
}

export interface Plugin {
	plugin_id: string;
	plugin_unique_identifier: string;
	installation_id: string;
	name: string;
	label: Record<string, string>;
	version: string;
	enabled: boolean;
	created_at: string;
}

export interface PluginListResponse {
	plugins: Plugin[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

export interface MCPServer {
	id: string;
	name: string;
	server_url: string;
	server_identifier: string;
	icon: string;
	tools: MCPTool[];
	created_at: string;
}

export interface MCPTool {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}

export interface Tag {
	id: string;
	name: string;
	type: string;
	binding_count: number;
}

export interface Conversation {
	id: string;
	status: string;
	from_source: string;
	from_end_user_session_id: string;
	from_account_name: string;
	name?: string;
	summary?: string;
	message_count?: number;
	created_at: number;
	updated_at: number;
}

export interface ConversationListResponse {
	data: Conversation[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

export interface Message {
	id: string;
	conversation_id: string;
	query: string;
	answer: string;
	message_tokens: number;
	answer_tokens: number;
	provider_response_latency: number;
	from_source: string;
	created_at: number;
	status: string;
	error: string | null;
}

export interface MessageListResponse {
	data: Message[];
	has_more: boolean;
	limit: number;
}

export interface App {
	id: string;
	name: string;
	mode: string;
	description: string;
	created_at: number;
	updated_at: number;
	icon: string;
	icon_background: string;
}

export interface AppListResponse {
	data: App[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

export interface ImportResponse {
	id: string;
	status: string;
	app_id?: string;
}

export interface Workflow {
	id: string;
	graph: Record<string, unknown>;
	features: Record<string, unknown>;
	hash: string;
	created_at: string;
	updated_at: string;
}

export interface Dataset {
	id: string;
	name: string;
	description: string;
	provider: string;
	permission: string;
	data_source_type: string;
	indexing_technique: string;
	app_count: number;
	document_count: number;
	word_count: number;
	created_by: string;
	created_at: number;
	updated_by: string;
	updated_at: number;
}

export interface DatasetListResponse {
	data: Dataset[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

export interface Document {
	id: string;
	position: number;
	data_source_type: string;
	name: string;
	created_from: string;
	created_by: string;
	created_at: number;
	tokens: number;
	indexing_status: string;
	word_count: number;
	enabled: boolean;
	disabled_at: number | null;
	archived: boolean;
	display_status: string;
	hit_count: number;
}

export interface DocumentListResponse {
	data: Document[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}

export interface Segment {
	id: string;
	position: number;
	document_id: string;
	content: string;
	answer: string;
	word_count: number;
	tokens: number;
	keywords: string[];
	index_node_id: string;
	index_node_hash: string;
	hit_count: number;
	enabled: boolean;
	created_by: string;
	created_at: number;
	indexing_at: number;
	completed_at: number;
	status: string;
}

export interface SegmentListResponse {
	data: Segment[];
	has_more: boolean;
	total: number;
	page: number;
	limit: number;
}
