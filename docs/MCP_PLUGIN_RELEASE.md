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
