# Changelog

## [Unreleased]

## [0.4.0] - 2026-03-26

### Added
- **MCP Server CRUD**: Full lifecycle management for MCP servers in Dify
  - `create_mcp_server` — add a new MCP server by URL (auto-discovers tools)
  - `update_mcp_server` — update server URL, name, or headers
  - `delete_mcp_server` — remove an MCP server from Dify
  - `refresh_mcp_server_tools` — re-fetch tools after server changes

## [0.3.0] - 2026-03-26

### Added
- **Model Providers**: Read-only tools for inspecting configured AI models
  - `list_model_providers` — list all providers (OpenAI, Anthropic, etc.) with status
  - `list_models` — list models for a specific provider
  - `list_models_by_type` — list all models across providers by type (llm, embedding, rerank, etc.)
- **Plugins**: Manage Dify plugins
  - `list_plugins` — list installed plugins with version and status
  - `install_plugin` — install a plugin from the Dify marketplace
- **MCP Servers**: Inspect MCP servers configured in Dify
  - `list_mcp_servers` — list all connected MCP servers with URLs
  - `get_mcp_server_tools` — list tools available on a specific MCP server

## [0.2.0] - 2026-03-26

### Added
- **Auto-login**: Automatic authentication on first request, auto-retry on 401 (token expired)
- **Knowledge Base tools**: Full CRUD for datasets, documents, and segments
  - `list_datasets`, `create_dataset`, `delete_dataset`
  - `list_documents`, `create_document_by_text`, `delete_document`
  - `list_segments`, `create_segment`, `update_segment`, `delete_segment`
- `bin` field in package.json for `npx dify-mcp-server` support
- npm package metadata (keywords, license, repository)
- CHANGELOG.md

### Changed
- Removed manual `login` tool — authentication is now automatic
- `DifyClient` constructor accepts credentials directly (no separate login step)
- Environment variables `DIFY_BASE_URL`, `DIFY_EMAIL`, `DIFY_PASSWORD` are now required at startup

### Fixed
- CSRF token sent on all requests including GET (was causing 401 errors)

## [0.1.0] - 2026-03-26

### Added
- Initial release
- Dify Console API client with cookie-based auth (Base64 password, __Host- cookies, CSRF)
- **App management**: `list_apps`, `create_app`, `delete_app`, `copy_app`
- **DSL import/export**: `import_dsl`, `export_app`
- **Workflow**: `get_workflow`, `update_workflow`, `publish_workflow`
- **API access**: `enable_api`, `enable_site`, `get_api_keys`, `create_api_key`
