# Declarative Forms plugin

Connects an MCP-capable client to `https://frms.dev/api/v1/mcp`. GitHub OAuth
creates or reconnects the user's personal workspace; no organization id is
exposed to the client.

The bundled authoring skill uses draft branches for preview and requires user
approval before publish or deletion. `plugin.json` and `mcp.json` are the
portable package; `.codex-plugin/plugin.json` and `.mcp.json` provide Codex
compatibility.
