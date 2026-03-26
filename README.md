# dify-mcp-server

MCP server for [Dify](https://dify.ai) Console API — programmatic agent creation, knowledge base management, workflow control.

Works with self-hosted Dify v1.6+ instances.

## Install

### Option 1: Binary (no dependencies needed)

Download a standalone binary from [GitHub Releases](https://github.com/overpod/dify-mcp-server/releases) — no Node.js, no Bun, nothing else required.

**macOS (Apple Silicon):**
```bash
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-darwin-arm64 -o dify-mcp-server
chmod +x dify-mcp-server
```

**macOS (Intel):**
```bash
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-darwin-x64 -o dify-mcp-server
chmod +x dify-mcp-server
```

**Linux (x64):**
```bash
curl -L https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-linux-x64 -o dify-mcp-server
chmod +x dify-mcp-server
```

**Windows (x64):**
```powershell
Invoke-WebRequest -Uri "https://github.com/overpod/dify-mcp-server/releases/latest/download/dify-mcp-server-windows-x64.exe" -OutFile "dify-mcp-server.exe"
```

### Option 2: npx (requires Node.js 18+)

```bash
npx dify-mcp-server
```

### Option 3: From source

```bash
git clone https://github.com/overpod/dify-mcp-server
cd dify-mcp-server
npm install
npm run build
node dist/index.js
```

## Configuration

Add to your `.mcp.json`:

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

Or with npx:

```json
{
  "mcpServers": {
    "dify": {
      "command": "npx",
      "args": ["dify-mcp-server"],
      "env": {
        "DIFY_BASE_URL": "https://your-dify-instance.com",
        "DIFY_EMAIL": "admin@example.com",
        "DIFY_PASSWORD": "your-password"
      }
    }
  }
}
```

## Tools

### Apps
| Tool | Description |
|------|-------------|
| `list_apps` | List all applications |
| `create_app` | Create app (chat, agent-chat, advanced-chat, workflow, completion) |
| `delete_app` | Delete an application |
| `copy_app` | Duplicate an application |

### DSL Import/Export
| Tool | Description |
|------|-------------|
| `import_dsl` | Import app from YAML DSL |
| `export_app` | Export app as YAML DSL |

### Workflow
| Tool | Description |
|------|-------------|
| `get_workflow` | Get draft workflow (nodes, edges, features) |
| `update_workflow` | Update draft workflow graph |
| `publish_workflow` | Publish draft to make it live |

### API Access
| Tool | Description |
|------|-------------|
| `enable_api` | Enable API access |
| `enable_site` | Enable web chat UI |
| `get_api_keys` | List API keys |
| `create_api_key` | Create a new API key |

### Knowledge Base
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

## Workflow Examples

### Create an agent from template

1. Export an existing app as DSL template
2. Modify the YAML (change prompt, model, tools)
3. Import as a new app
4. Publish and enable API access

### Build a knowledge base

1. Create a dataset
2. Add documents by text
3. Attach the dataset to an app's workflow

## Auth Notes

- Uses Dify's undocumented Console API (`/console/api/`)
- Password is Base64-encoded (Dify's `@decrypt_password_field`)
- Auth via HttpOnly cookies with CSRF token (Dify 1.9.2+)
- Auto-login on first request, auto-retry on 401
- Console API is internal — may change between Dify versions

## License

MIT
