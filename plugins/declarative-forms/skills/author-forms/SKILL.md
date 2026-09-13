---
name: author-forms
description: Create, update, preview, and publish Declarative Forms through the authenticated MCP server.
---

# Author Declarative Forms

Use the `declarativeforms://schema` resource before writing YAML. Treat the
server response as the source of truth for form ids, branch names, revisions,
and URLs.

## Workflow

1. Use `list_forms` and `read_form` before changing an existing form.
2. Use `create_form` with a complete schema-valid YAML document for a new form.
3. For an existing form, create a descriptive branch with `create_branch`, then
   replace that branch's complete YAML using `update_form`.
4. Give the user the returned `preview_url` and summarize the material changes.
5. Call `publish_branch` only after the user explicitly approves publishing.

Direct updates to `main` are allowed only when the user explicitly asks to skip
the draft workflow. Ask for confirmation immediately before `delete_form`,
`delete_branch`, or `publish_branch`. Never invent ids or report a write as
successful unless the tool returned the changed form.
