import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DifyClient } from "../dify-client.js";
import { registerAppTools } from "./apps.js";
import { registerConversationTools } from "./conversations.js";
import { registerKnowledgeTools } from "./knowledge.js";
import { registerMcpServerTools } from "./mcp-servers.js";
import { registerModelTools } from "./models.js";
import { registerPluginTools } from "./plugins.js";
import { registerTagTools } from "./tags.js";
import { registerWorkflowTools } from "./workflow.js";

export const registerTools = (server: McpServer, client: DifyClient) => {
	registerAppTools(server, client);
	registerWorkflowTools(server, client);
	registerKnowledgeTools(server, client);
	registerModelTools(server, client);
	registerPluginTools(server, client);
	registerMcpServerTools(server, client);
	registerTagTools(server, client);
	registerConversationTools(server, client);
};
