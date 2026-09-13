---
name: author-forms
description: Build thoughtful forms from user intent; create, update, preview, and publish forms and manage organization access through the authenticated MCP server.
---

# Author Declarative Forms

Read `declarativeforms://schema` and `declarativeforms://authoring-guide` before
writing YAML. Treat the
server response as the source of truth for form ids, branch names, revisions,
and URLs.

## Intent and quality

Follow the user's exact instructions and constraints. Where details are missing,
make a best effort to deliver a useful first version, then ask one or two focused
follow-up questions about refinements. Ask before building only when missing
information prevents a correct or authorized action.

Use contextual titles and descriptions, concise labels, appropriate field types
and validation, and a helpful completion message. Keep short forms short: avoid
unnecessary welcome screens, sections, or unrequested questions. Honor explicit
requests for a plain or minimal form. Preserve supplied branding; otherwise use
the renderer's defaults. Current theme controls are primary color and logo.
When `start: false`, put the visible heading and introduction on the first
section; the form-level title is used for the document title.
Include an explicit email-format pattern validator for email fields; the email
type alone does not enforce format in the current renderer. Reuse the pattern
in the authoring guide's RSVP example.

For a lunch RSVP asking for name and email, keep exactly those two fields. Add
welcoming lunch-specific copy, required validation, and an RSVP confirmation.
Do not invent a date, location, branding, or logo URL, or promise notifications
without a configured connection. After delivering the preview, offer to add
event details or a dietary requirements question; wait for the user's request
before adding them. The authoring guide contains a complete example.

## Organizations and members

Use `list_organizations` to discover accessible organization IDs and caller
roles. Default to the personal workspace unless the user explicitly selects
another organization in the conversation. Carry its `organization_id` through
every subsequent form and branch call. Name the destination organization when
delivering the form. Never invent organization IDs or silently choose another
organization when access is denied.

Both admins and members can manage forms and branches. Only admins can use
`add_organization_member`. For requests to invite someone, this tool grants
membership immediately, sends no email, and requires no acceptance. Default new
members to `member`; existing members' roles are preserved.

## Workflow

1. Use `list_forms` and `read_form` before changing an existing form.
2. Use `create_form` with a complete schema-valid YAML document for a new form.
   New forms are created on `main` and their public URL is immediately available;
   do not describe them as unpublished drafts.
3. For an existing form, create a descriptive branch with `create_branch`, then
   replace that branch's complete YAML using `update_form`.
4. Give the returned `preview_url`, name the destination organization, summarize
   material choices or changes, and offer one or two focused follow-up questions.
5. Call `publish_branch` only after the user explicitly approves publishing.

Direct updates to `main` are allowed only when the user explicitly asks to skip
the draft workflow. Confirm immediately before `delete_form`, `delete_branch`,
or `publish_branch` unless the user has already explicitly approved that action.
Never invent ids or report a write as
successful unless the tool returned the changed form.
