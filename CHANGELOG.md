# Changelog

## [Unreleased]

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
