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

**Option A: Homebrew** (macOS / Linux):

```bash
brew tap overpod/tap
brew install dify-mcp-server
```

**Option B: Download binary** (no dependencies needed):

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

**Add to your `.mcp.json`:**

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

**Use from Claude Code:**

> "List all my Dify apps"
> "Create a new chat app called Customer Support"
> "Export the Customer Support app as YAML"
> "Connect an MCP server at https://mcp.example.com/sse to Dify"
> "What models are configured in my Dify instance?"

### Alternative: From source

```bash
git clone https://github.com/overpod/dify-mcp-server
cd dify-mcp-server
bun install && bun run build
bun dist/index.js
```

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
bun install
```

```bash
# Hot reload
DIFY_BASE_URL=https://your-dify.com DIFY_EMAIL=admin@example.com DIFY_PASSWORD=secret bun run dev

# Type check and lint
bun run check    # biome check
bun run build    # tsc

# Run tests
bun run test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector bun dist/index.js
```

### Requirements

- [Bun](https://bun.sh/) 1.3+
- Self-hosted Dify v1.6+ instance
- Dify admin account (email/password)

## Contributing

1. Fork the repo and create a branch from `main`
2. Run `bun run check` — code must pass Biome linting
3. Run `bun run build` — code must compile without errors
4. Run `bun run test` — tests must pass
5. Update `CHANGELOG.md` under `## [Unreleased]`
6. Keep PRs focused — one feature or fix per PR

### Adding a new tool

1. Add the API method to `src/dify-client.ts`
2. Register the MCP tool in `src/index.ts` with Zod schema
3. Add an entry to `CHANGELOG.md`

### Code style

- **Formatter/linter:** [Biome](https://biomejs.dev/) (tabs, 100 line width)
- **Language:** TypeScript strict mode
- Run `bun run fix` to auto-format

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
