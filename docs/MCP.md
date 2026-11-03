# ChatGPT form authoring

The API provides a Streamable HTTP MCP server at `/mcp`. GitHub authenticates
form authors; it does not store the new definitions or grant repository access.
MongoDB stores these definitions, ownership, revisions, and OAuth grants.
Existing GitHub forms retain their current URLs and behavior.

## Deployment

1. Deploy the existing Compose stack at a public HTTPS hostname. The web
   application's rewrites forward `/mcp`, `/oauth/*`, and OAuth discovery to the
   API. Rebuild **both web and API** when installing this change.
2. Register a **GitHub OAuth App** in GitHub Developer settings. Set its homepage
   to your public origin and its authorization callback to
   `https://YOUR_HOST/oauth/github/callback`. Generate a client secret.
3. Set `MCP_PUBLIC_ORIGIN=https://YOUR_HOST` (no trailing slash),
   `GITHUB_OAUTH_CLIENT_ID`, and `GITHUB_OAUTH_CLIENT_SECRET` in the deployment
   environment. Restart the API. These are operator credentials, never values
   to put into form definitions or ChatGPT prompts.
4. If using webhooks, set `MCP_WEBHOOK_URLS` to comma-separated exact HTTPS URLs
   that you trust, on **both API and scheduler**. Defaults deny webhook authoring
   for MongoDB forms. Redirects are rejected when these webhooks execute. Do not
   approve endpoints that resolve to private infrastructure or redirect requests.
5. In a ChatGPT account/workspace with custom MCP connections enabled, create a
   custom connection to `https://YOUR_HOST/mcp`, using OAuth. This implementation
   supports ChatGPT's client metadata identity
   `https://chatgpt.com/oauth/client.json` and its stable callback
   `https://chatgpt.com/connector_platform_oauth_redirect`. It advertises issuer
   identification and returns `iss`. No static MCP client secret is needed.
6. Connect, review the form-authoring permissions, and sign in with GitHub.
   GitHub repository or email scopes are not requested. Every GitHub user can
   join. The immutable GitHub numeric ID is the ownership identity.

If the MCP environment variables are absent, `/mcp` returns a configuration
error and existing form serving remains available. Partial credentials do not
turn on OAuth. Use an HTTPS tunnel for local ChatGPT acceptance; local HTTP
cannot exercise the secure browser cookie flow.

Official references: [OpenAI authentication](https://developers.openai.com/plugins/build/auth),
[custom MCP connections](https://developers.openai.com/api/docs/guides/custom-mcp-server),
[GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## Authoring contract

- `get_form_schema`: engine JSON Schema, example and configured capabilities.
- `list_forms`: owned MongoDB forms, bounded to 20 by default and 100 maximum;
  use the last returned ID as `afterId` until a page is empty.
- `get_form`: definition, revision, and public URL of an owned form.
- `validate_form`: schema/configuration issues with JSON paths; no writes.
- `create_form`: complete `definition` and a unique `creationKey`. Reuse the key
  when retrying the same creation; a reused key returns the existing form and
  never replaces it. Use another key for an intentionally different form.
- `update_form`: complete replacement `definition`, `id`, and expected
  `revision`. Reread and reconcile a stale revision before retrying.

The tool returns a live `https://YOUR_HOST/<id>` URL. Publishing is immediate.
The existing frontend renders the definition and submissions follow the existing
API. Owners can manage only their own forms, but **public form definitions are
visible to respondents**. Never embed private tokens in them.

The full engine format remains available. Email, uploads, verification,
Turnstile, and adaptive sections require the same deployment configuration as
existing forms. Schema validation does not prove every conditional answer path
works; test representative paths for complex forms. No submissions-reading,
GitHub-form management, sharing, or deletion tools are provided.

## Authentication and operations

Authorization codes and browser grants expire after five minutes and are consumed
atomically. MCP access tokens expire after one hour. Refresh tokens rotate and
have a fixed 30-day session lifetime; reuse of an old refresh token revokes the
session. `/oauth/revoke` accepts form-encoded `token` and `client_id`. Expiry is
checked on every lookup, independently of MongoDB TTL cleanup. Credential hashes
are stored instead of bearer credentials; GitHub access tokens are used only to
fetch identity and are not persisted.

Discovery advertises the canonical MCP resource and scopes `forms:read` and
`forms:write`. Both permissions are requested for this authoring integration.
Redirects and client identities are explicitly restricted to ChatGPT, and remote
client metadata redirects are refused. Anonymous MCP requests receive a bearer
challenge with resource metadata. All tool requests require authentication.

Authoring is limited to 60 MCP requests per minute per GitHub user across API
instances, plus 120 per minute per source IP per instance. OAuth endpoints also
have rate limits. Request logging omits query strings and redacts credentials.
MongoDB must be backed up for both definitions and authentication state. Removing
an owner's `oauth_sessions` revokes their existing connections; it does not block
future GitHub sign-in. ChatGPT may request confirmation for writes; tool metadata
cannot override client policies.

## Verification

Run the standard package checks and the database integration suite against a
local test MongoDB. The suite creates and drops its own randomly named database:

```sh
MCP_TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm run test:mcp -w @declarativeforms/api
```

Without this variable the database suite is skipped. The suite exercises actual
MongoDB ownership, atomic revision writes, idempotency, OAuth code consumption,
rotation/replay/revocation, and a mocked GitHub callback through Fastify, plus MCP
client/server communication. No real GitHub credentials are used by these tests.

Before production acceptance, connect a real ChatGPT account to the deployment:

1. Request a contact form and follow its returned link; submit a response.
2. Ask ChatGPT to list the form and add a field; check the same public URL.
3. Repeat with a second GitHub account and verify owner isolation.
4. Verify an existing GitHub-backed form and submission still work.
5. Revoke the MCP token and verify that reconnecting is required.

This live test requires operator-provided GitHub credentials, public hosting,
and an eligible ChatGPT account; protocol tests do not replace it.

The browser consent regression runs separately with `npm run test:mcp-browser -w @declarativeforms/api`. Install Chromium with `npx playwright install chromium`, or set `MCP_TEST_BROWSER_PATH` to an existing Chrome executable. It verifies browser-generated Origin headers, the secure consent cookie, and the permitted GitHub redirect without real credentials.
