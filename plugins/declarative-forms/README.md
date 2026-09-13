# Declarative Forms plugin

See the [MCP connection guide](https://frms.dev/docs/mcp) for ChatGPT web,
Codex CLI, Claude web, and Claude Code setup, authentication, and examples.
MCP-managed forms are stored in Declarative Forms, not committed to GitHub.
Copy the YAML into a public repository to use Git as the source of truth.

Connects an MCP-capable client to `https://frms.dev/api/v1/mcp`. GitHub OAuth
creates or reconnects the user's personal workspace. `list_organizations`
discovers accessible organizations and roles. Every form and branch tool accepts
an optional `organization_id`; omission defaults to the personal workspace.
Both admins and members can manage forms. Admins can use
`add_organization_member` to grant membership immediately without sending email.

The bundled authoring skill uses draft branches for preview and requires user
approval before publish or deletion. `plugin.json` and `mcp.json` are the
portable package; `.codex-plugin/plugin.json` and `.mcp.json` provide Codex
compatibility.

The server also exposes `declarativeforms://schema` and
`declarativeforms://authoring-guide` for clients that do not load the bundled
skill. Authoring follows exact instructions, makes reasonable presentation
choices when details are missing, and offers refinements after a working form.
New forms are created on `main` with an immediately available public URL.
