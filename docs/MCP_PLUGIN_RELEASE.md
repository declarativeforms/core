# MCP plugin release runbook

The migration is releasable only when every gate below passes in order. Keep
the previous API image tag available until the production acceptance gate is
complete.

## 1. Provision OAuth secrets

- Create a GitHub OAuth app with callback
  `<PUBLIC_BASE_URL>/api/v1/oauth-github/callback`.
- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OAUTH_STATE_SECRET`, and at
  least two comma-separated `OAUTH_COOKIE_KEYS` values.
- Set `OAUTH_JWKS` to a private JWKS containing an asymmetric signing key with
  a stable `kid`. Store it as a secret, never in this repository.
- Confirm `PUBLIC_BASE_URL` is the final HTTPS origin with no path suffix.

## 2. Deploy and verify protocol discovery

Deploy `web`, `api`, and `scheduler`, then verify:

```sh
curl -fsS https://frms.dev/.well-known/oauth-protected-resource/api/v1/mcp
curl -fsS https://frms.dev/.well-known/oauth-authorization-server/api/v1/oauth
curl -fsS https://frms.dev/api/v1/oauth/jwks
```

The protected-resource response must identify
`https://frms.dev/api/v1/mcp`; authorization metadata must use the
`https://frms.dev/api/v1/oauth` issuer and advertise PKCE-capable authorization
code flow. An unauthenticated MCP request must return `401` with a
`WWW-Authenticate` challenge pointing to the protected-resource metadata.

## 3. Acceptance-test the authoring journey

Run the automated MCP check before deployment:

```sh
npm test -w @declarativeforms/api -- --runInBand
MCP_TEST_MONGODB_URL=mongodb://127.0.0.1:27017 npm run test:mcp -w @declarativeforms/api
```

The MCP check requires a running MongoDB instance. It uses real repositories,
signed test tokens, and the Fastify MCP endpoint; it creates a randomly named
`mcp_check_*` database and drops only that database on completion. It covers
discovery, the schema-valid RSVP example, form/branch lifecycles, personal
defaults, shared organization access, role checks, email validation, concurrent
member additions, and denial after membership removal.

Local browser checks of the RSVP example passed at desktop (1440×900) and mobile
(390×844) sizes for visible copy, no horizontal overflow, required/email
validation, and personalized completion. An existing renderer accessibility
follow-up remains: field labels render separately from their inputs without
`htmlFor`/`id` or `aria-labelledby` associations. Address that in the renderer
separately; this iteration changes MCP authoring and organization support.

Connect `https://frms.dev/api/v1/mcp` from a clean MCP client and record the
result of each test:

1. Sign in with GitHub, disconnect, reconnect, and confirm the same forms are
   visible.
2. Read `declarativeforms://schema` and create a valid form.
3. Read and directly update `main`; confirm its public URL renders the update.
4. Create a draft branch, update it, and confirm its `preview_url` renders while
   the main URL remains unchanged.
5. Publish the draft and confirm main now matches it.
6. Attempt invalid YAML, a duplicate branch, deletion of `main`, and access to
   a form owned by another account; each operation must fail without data loss.
7. Revoke the OAuth grant and confirm the old token can no longer call MCP.
8. Run the original prompt: "Use the frms.dev plugin to create a form that
   captures a name and email address for lunch RSVP." Confirm exactly those two
   fields, visible lunch-specific copy, required and email-format validation,
   and a useful completion message. Check the preview on desktop and mobile.
   The response must identify the destination and returned URL, offer focused
   follow-up questions, and avoid inventing event details or promising email.
9. Repeat with an explicit request for a plain, minimal form; confirm the client
   honors that constraint. Read `declarativeforms://authoring-guide` from a
   client without the bundled skill and repeat the authoring journey.
10. Use `list_organizations`, create a form in a named organization, and verify
    the client carries its ID through subsequent form and branch calls. Confirm
    that omitting `organization_id` defaults to the personal workspace.
11. As an admin, add a member with `add_organization_member`. Confirm immediate
    access without any invitation email or acceptance step. Sign in as that
    member and edit/publish/delete a test form; attempts to add other members
    must fail. Re-adding someone must preserve their existing role.

Run the same journey in ChatGPT developer mode and one non-OpenAI MCP client
before public submission.

## 4. Package and submit

- Validate `plugins/declarative-forms/.codex-plugin/plugin.json` with the plugin
  validator and JSON-parse both portable manifests.
- Confirm the public privacy policy matches the deployed data flow.
- Submit the remote HTTPS MCP endpoint and the
  `plugins/declarative-forms` package to the universal Plugins Directory.
- Replace the website's repository CTA with the approved directory URL after
  approval; do not advertise an unapproved listing.

## 5. Remove the compatibility window

The Studio package and its private REST routes are removed in this release.
Retain the previous image tag only for rollback. Delete old OAuth secrets and
the retired Studio DNS record after the production acceptance window closes
and rollback is no longer required.
