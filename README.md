# dify-mcp-server

MCP server for Dify Console API — programmatic agent creation, DSL import/export, workflow management.

Works with self-hosted Dify v1.6+ instances.

## Tools

| Tool | Description |
|------|-------------|
| `login` | Authenticate with Dify Console API |
| `list_apps` | List all applications |
| `create_app` | Create a new app (chat, agent-chat, advanced-chat, workflow, completion) |
| `delete_app` | Delete an application |
| `copy_app` | Duplicate an application |
| `import_dsl` | Import app from YAML DSL |
| `export_app` | Export app as YAML DSL |
| `get_workflow` | Get draft workflow (nodes, edges, features) |
| `update_workflow` | Update draft workflow graph |
| `publish_workflow` | Publish draft to make it live |
| `enable_api` | Enable API access |
| `enable_site` | Enable web chat UI |
| `get_api_keys` | List API keys for an app |
| `create_api_key` | Create a new API key |

## Setup

```bash
npm install
npm run build
```

## Usage with Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "dify": {
      "command": "node",
      "args": ["/path/to/dify-mcp-server/dist/index.js"],
      "env": {
        "DIFY_BASE_URL": "https://your-dify-instance.com",
        "DIFY_EMAIL": "admin@example.com",
        "DIFY_PASSWORD": "your-password"
      }
    }
  }
}
```

## Workflow

1. Call `login` to authenticate
2. Use `create_app` or `import_dsl` to create agents
3. Use `get_workflow` / `update_workflow` to configure
4. Call `publish_workflow` to go live
5. Use `enable_api` + `create_api_key` to get API access

### DSL template strategy

1. Create one agent manually in Dify UI
2. `export_app` to get the YAML DSL
3. Modify the DSL programmatically
4. `import_dsl` to create new agents from the template

## Auth notes

- Uses Dify's undocumented Console API (`/console/api/`)
- Password is Base64-encoded (Dify's `@decrypt_password_field`)
- Auth via HttpOnly cookies with CSRF token (Dify 1.9.2+)
- Console API is internal — may change between Dify versions

## License

MIT
