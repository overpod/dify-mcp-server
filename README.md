# dify-mcp-server

[![GitHub Release](https://img.shields.io/github/v/release/overpod/dify-mcp-server)](https://github.com/overpod/dify-mcp-server/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![52 Tools](https://img.shields.io/badge/MCP_Tools-52-green)](https://github.com/overpod/dify-mcp-server)

MCP server for [Dify](https://dify.ai) Console API — manage apps, workflows, knowledge bases, models, plugins, and MCP servers programmatically from Claude Code or any MCP client.

Works with self-hosted Dify v1.6+ instances (v1.10+ recommended for plugins and MCP tools).

## What can you do?

- Create and configure Dify apps from Claude Code
- Import/export apps as YAML DSL templates
- Build knowledge bases with datasets, documents, and segments
- Manage model providers and set default models
- Install, upgrade, and remove plugins
- Connect MCP servers to Dify programmatically
- Organize apps with tags
- Browse conversation and message history

## Quick Start

**1. Download the binary** (no dependencies needed):

```bash
# macOS (Apple Silicon)
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-darwin-arm64 -o dify-mcp-server
chmod +x dify-mcp-server

# macOS (Intel)
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-darwin-x64 -o dify-mcp-server
chmod +x dify-mcp-server

# Linux (x64)
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-linux-x64 -o dify-mcp-server
chmod +x dify-mcp-server
```

Windows:
```powershell
Invoke-WebRequest -Uri "https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-windows-x64.exe" -OutFile "dify-mcp-server.exe"
```

**2. Add to your `.mcp.json`:**

```json
{
  "mcpServers": {
    "dify": {
      "command": "./dify-mcp-server",
      "env": {
        "DIFY_BASE_URL": "https://your-dify-instance.com",
        "DIFY_EMAIL": "admin@example.com",
        "DIFY_PASSWORD": "your-password"
      }
    }
  }
}
```

**3. Use from Claude Code:**

> "List all my Dify apps"
> "Create a new chat app called Customer Support"
> "Export the Customer Support app as YAML"
> "Connect an MCP server at https://mcp.example.com/sse to Dify"
> "What models are configured in my Dify instance?"

### Alternative: From source

```bash
git clone https://github.com/overpod/dify-mcp-server
cd dify-mcp-server
npm install && npm run build
node dist/index.js
```

## Tools (52)

### Apps (6)
| Tool | Description |
|------|-------------|
| `list_apps` | List all applications |
| `create_app` | Create app (chat, agent-chat, advanced-chat, workflow, completion) |
| `get_app` | Get detailed info about an application |
| `update_app` | Update name, description, or icon |
| `delete_app` | Delete an application |
| `copy_app` | Duplicate an application |

### DSL Import/Export (2)
| Tool | Description |
|------|-------------|
| `import_dsl` | Import app from YAML DSL |
| `export_app` | Export app as YAML DSL |

### Workflow (3)
| Tool | Description |
|------|-------------|
| `get_workflow` | Get draft workflow (nodes, edges, features) |
| `update_workflow` | Update draft workflow graph |
| `publish_workflow` | Publish draft to make it live |

### API Access (4)
| Tool | Description |
|------|-------------|
| `enable_api` | Enable API access |
| `enable_site` | Enable web chat UI |
| `get_api_keys` | List API keys |
| `create_api_key` | Create a new API key |

### Model Providers (5)
| Tool | Description |
|------|-------------|
| `list_model_providers` | List all providers (OpenAI, Anthropic, etc.) with status |
| `list_models` | List models for a specific provider |
| `list_models_by_type` | List all models by type across all providers |
| `get_default_model` | Get the default model for a type |
| `set_default_model` | Set the default model for a type |

### Plugins (5)
| Tool | Description |
|------|-------------|
| `list_plugins` | List installed plugins |
| `install_plugin` | Install a plugin from the marketplace |
| `uninstall_plugin` | Remove an installed plugin |
| `upgrade_plugin` | Upgrade plugin to a new version |
| `get_plugin_task` | Check install/upgrade task status |

### MCP Servers (6)
| Tool | Description |
|------|-------------|
| `list_mcp_servers` | List MCP servers configured in Dify |
| `get_mcp_server_tools` | Get tools of a specific MCP server |
| `create_mcp_server` | Add a new MCP server by URL |
| `update_mcp_server` | Update server URL, name, or headers |
| `delete_mcp_server` | Remove an MCP server |
| `refresh_mcp_server_tools` | Re-fetch tools from an MCP server |

### Tags (5)
| Tool | Description |
|------|-------------|
| `list_tags` | List all tags with binding counts |
| `create_tag` | Create a new tag |
| `delete_tag` | Delete a tag |
| `bind_tag` | Attach tags to an app or dataset |
| `unbind_tag` | Remove a tag from an app or dataset |

### Conversations & Messages (4)
| Tool | Description |
|------|-------------|
| `list_conversations` | List conversations for an app |
| `delete_conversation` | Delete a conversation |
| `list_messages` | List messages in a conversation |
| `get_message` | Get full message details |

### Knowledge Base (10)
| Tool | Description |
|------|-------------|
| `list_datasets` | List all datasets |
| `create_dataset` | Create a dataset |
| `delete_dataset` | Delete a dataset |
| `list_documents` | List documents in a dataset |
| `create_document_by_text` | Add a text document |
| `delete_document` | Delete a document |
| `list_segments` | List segments (chunks) |
| `create_segment` | Add a segment |
| `update_segment` | Update a segment |
| `delete_segment` | Delete a segment |

## Use Case Examples

### Create an agent from template
```
1. export_app → get YAML DSL of an existing app
2. Edit the YAML (change prompt, model, tools)
3. import_dsl → import as a new app
4. publish_workflow → make it live
5. enable_api + create_api_key → get API access
```

### Build a knowledge base
```
1. create_dataset → new knowledge base
2. create_document_by_text → add documents
3. Attach dataset to an app workflow
```

### Connect MCP servers to Dify
```
1. create_mcp_server → add by URL (auto-discovers tools)
2. list_mcp_servers → verify connection
3. get_mcp_server_tools → see available tools
4. refresh_mcp_server_tools → update after changes
```

### Manage model configuration
```
1. list_model_providers → see configured providers
2. list_models → check available models
3. set_default_model → set workspace default LLM
```

## Development

```bash
git clone https://github.com/overpod/dify-mcp-server
cd dify-mcp-server
npm install
```

```bash
# Hot reload
DIFY_BASE_URL=https://your-dify.com DIFY_EMAIL=admin@example.com DIFY_PASSWORD=secret npm run dev

# Type check and lint
npm run check    # biome check
npm run build    # tsc

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Requirements

- Node.js 18+ or Bun
- Self-hosted Dify v1.6+ instance
- Dify admin account (email/password)

## Contributing

1. Fork the repo and create a branch from `main`
2. Run `npm run check` — code must pass Biome linting
3. Run `npm run build` — code must compile without errors
4. Test against a real Dify instance (not mocked)
5. Update `CHANGELOG.md` under `## [Unreleased]`
6. Keep PRs focused — one feature or fix per PR

### Adding a new tool

1. Add the API method to `src/dify-client.ts`
2. Register the MCP tool in `src/index.ts` with Zod schema
3. Add the tool to the table in `README.md`
4. Add an entry to `CHANGELOG.md`

### Code style

- **Formatter/linter:** [Biome](https://biomejs.dev/) (tabs, 100 line width)
- **Language:** TypeScript strict mode
- Run `npm run fix` to auto-format

### Releases

Releases are automated. Tag and push:

```bash
git tag v0.7.0
git push --tags
```

GitHub Actions builds binaries for all platforms and creates a release with notes from CHANGELOG.

## Auth Notes

- Uses Dify's undocumented Console API (`/console/api/`)
- Password is Base64-encoded (Dify's `@decrypt_password_field`)
- Auth via HttpOnly cookies with CSRF token (Dify 1.9.2+)
- Auto-login on first request, auto-retry on 401
- Console API is internal — may change between Dify versions

## License

MIT
