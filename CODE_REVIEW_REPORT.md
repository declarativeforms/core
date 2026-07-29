# Principal engineer code review

> **Historical report:** This document records the review and remediation of
> commit `081b077`. Its API-managed form trust model, file ledger, test counts,
> and deployment disposition are snapshots and are superseded by the current
> Git-native implementation. The current model uses source-addressed `g.` IDs
> and `GITHUB_TRUSTED_REPOSITORIES`; see the README, architecture guide, and
> current test suite for authoritative behavior.

## Review scope

- Branch: `revamp`
- Reviewed commit: `081b077` (`complete revamp`)
- Baseline: `main` at `d648940`
- Diff: 295 paths, 10,199 insertions, 23,601 deletions
- Decision: **Request changes — do not deploy this revision to an internet-facing environment yet**

## Remediation addendum

The decision above applies to commit `081b077`, which is the revision reviewed
in the body of this report. The uncommitted remediation work completed after
the review changes the current disposition to **ready for product-owner
review**. No Git commit has been created.

The product decisions used for implementation are:

- anonymous public GitHub paths are render-only; API-managed and protected
  registrations are trusted;
- uploads use short-lived form/field-scoped capabilities, byte-based type
  detection, quotas, non-executable delivery headers, and form-deletion
  cleanup;
- integration delivery is best-effort with persisted, bounded attempt state
  and respondent-visible status;
- resume uses a separate signed seven-day respondent capability;
- hidden answers and their secondary tokens are deleted; and
- deleting a managed form cascades to its submissions and upload prefix.

| Finding | Outcome |
| --- | --- |
| CRITICAL-01 | Resolved: public sources cannot execute connections or enable external analytics; trusted webhooks require public HTTPS targets, revalidate redirects, time out, and fail on non-2xx responses. |
| CRITICAL-02 | Resolved: anonymous upload was replaced by scoped capabilities and global/per-form limits. Upload types are detected from bytes; active/unknown content is forced to attachment with CSP and `nosniff`; managed-form deletion removes its objects. |
| HIGH-01 | Resolved: a dedicated respondent projection removes connections and other server-only fields. |
| HIGH-02 | Resolved: core now provides total definition validation and authoritative server submission validation for completed and partial data. Unknown and invisible values are removed. |
| HIGH-03 | Resolved for the selected best-effort model: completion is monotonic and connection attempts/status/errors are persisted, idempotent, and capped at three. |
| HIGH-04 | Resolved: challenges are form/field scoped, normalized, rate-limited, attempt-limited, invalidated on success, and TTL indexed. |
| HIGH-05 | Resolved: signed resume reads restore answers, completion state, active section, and reconstructed history. |
| HIGH-06 | Resolved: file state is hydrated from controller values and multi-file batches append safely within the configured maximum. |
| HIGH-07 | Resolved: replacement definitions and initial state reset renderer runtime; effects commit only after host persistence succeeds. |
| HIGH-08 | Resolved: source IDs use 128 bits of SHA-256 and the repository migrates legacy short-ID records without allowing a public lookup to downgrade trust. |
| MEDIUM-01–12 | Resolved: nested schema limits, restored field state, hidden-value removal, deterministic navigation, escaped email output, bounded GitHub retrieval, indexes/cascade cleanup, proxy handling, startup/readiness checks, safer privacy defaults, reactive locale handling, package licenses/docs, and renderer-instance API configuration are implemented. |
| LOW-01 | Addressed: OpenAPI now models respondent projections, capabilities, resume, challenge bodies, errors, rate limits, delivery state, and the supported form surface; CI parses it. Route/schema duplication remains a low-priority maintenance tradeoff. |
| LOW-02 | Addressed: suites now include malformed definitions, server validation, trust, delivery retry, capability scope/expiry, SSRF, file signatures, OTP attempts, renderer reset/rollback, and interactive multi-file restoration. Docker and HTTP smoke checks were also run manually. |
| LOW-03 | Partially addressed: the API production image installs only API/core production dependencies and Mixpanel is split from the main bundle. Exact image digests, Docker-socket isolation, and further renderer chunk splitting remain deployment-hardening backlog items. |
| LOW-04 | Resolved: local Nginx accepts the same 10 MB request size as the API. |
| LOW-05 | Resolved compatibly: internal rendering uses `PlainText`; `HtmlText` remains only as a deprecated escaped-text alias. |

Verification of the remediated worktree:

| Check | Result |
| --- | --- |
| Unit and interactive tests | 34 passed across core, React, API, and browser-like renderer suites. |
| Build | Core, React, API, and web production builds pass. The main web chunk is reduced from 1.08 MB to 672.79 kB; further splitting remains LOW-03. |
| Lint and OpenAPI | API formatting, web ESLint, OpenAPI YAML parsing, and `git diff --check` pass. |
| Package dry-runs | Core and React include their Apache-2.0 license and publishable output. |
| Dependency audit | Production dependencies report zero advisories. Current high advisories are confined to Jest/glob and Vite/esbuild development tooling; npm offers no non-breaking complete remediation. |
| Docker | Local images build, all four long-running services are healthy, and liveness/readiness checks pass. |
| HTTP smoke tests | Both GitHub examples load with 128-bit IDs and redacted connections. Managed-form validation, failed SSRF-safe delivery state, resume, monotonic completion, upload spoof rejection, content detection, and safe response headers pass. Temporary smoke-test forms/files were deleted. |

I reviewed the branch in dependency order: repository and build configuration,
the framework-independent core, the API and persistence boundary, the React
renderer, the hosted web application, then Docker, CI, and documentation. The
file ledger at the end gives an explicit disposition for every path in the
branch diff. I also read unchanged files when a changed file still depended on
them, notably the email challenge and upload routes.

The desired architecture is now visible:

```text
YAML / JSON definition
        ↓
@declarativeforms/core compiles one FormView
        ↓
@declarativeforms/react renders that view
        ↓
web host persists effects through the API
```

The Studio removal and package separation are good changes. The release
blockers are at the trust boundaries: public GitHub YAML can currently cause
the server to make arbitrary network requests and send email, and anonymous
uploads can publish active content on the application's own origin.

## What is working well

- The Studio workspace, Studio routes, Studio authentication, Firebase
  deployment files, and obsolete `common`, `runtime`, and `types` packages have
  been removed without leaving a build-time dependency behind.
- `@declarativeforms/core` is framework independent and exposes the intended
  parse → validate → compile → transition flow.
- `FormView` contains one active section, which makes the compiler/renderer
  handoff easy to follow.
- `@declarativeforms/react` supports field-component overrides without forcing
  hosts to own navigation or validation plumbing.
- Management and submission-read endpoints use one small, timing-safe Bearer
  API-key middleware. The GitHub token stays server-side and is no longer
  persisted with source records.
- The production Compose topology exposes only Traefik, keeps MongoDB and
  MinIO on an internal network, persists data in named volumes, runs the API as
  a non-root user, and configures automatic TLS.
- The branch is mechanically healthy: tests, builds, lint, diff checks,
  OpenAPI YAML parsing, package dry-runs, and Compose parsing were exercised.

## Release-blocking findings

### CRITICAL-01 — Public GitHub YAML is treated as executable server configuration

Affected files:

- `packages/api/src/core/services/form.service.ts:92-126`
- `packages/api/src/core/services/submission.service.ts:119-148`
- `packages/api/src/core/strategies/webhook-connection.strategy.ts:14-20`
- `packages/api/src/core/strategies/email-connection.strategy.ts:50-87`
- `packages/api/src/routes/forms-slug-get.ts:27-45`
- `docs/getting-started/create-a-form.mdx:30-65`

`GET /api/v1/forms/:owner/:repository/*` anonymously downloads any public YAML
file and registers it as a form. The same untrusted definition is later loaded
by `SubmissionService`, which executes its `connections`.

A public repository author can therefore:

- configure a webhook to an arbitrary URL and make the API `POST` submission
  data to it; this is an unauthenticated SSRF path into loopback, cloud metadata,
  and private network services;
- configure/interpolate arbitrary recipients and consume the self-hoster's
  Resend account as an email relay; and
- repeatedly trigger both effects using the public submission endpoint.

The getting-started guide explicitly tells public repository authors to add an
email connection, so the unsafe behavior is part of the documented product
contract rather than an isolated coding mistake.

Required direction: choose and encode a trust model. My recommendation is that
anonymous public-repository URLs are **render-only**. Server effects should run
only for API-managed forms or GitHub sources explicitly registered through the
management API. Even for trusted forms, webhook delivery needs HTTPS-only URL
validation, private/link-local address blocking after DNS resolution, redirect
revalidation, a timeout, and response-status handling.

Tests required: public definitions cannot execute connections; registered
definitions can; loopback/private/link-local/redirect webhook targets are
rejected; failed webhook status and timeout behavior are deterministic.

### CRITICAL-02 — Anonymous file upload is an unlimited same-origin publishing service

Affected files:

- `packages/api/src/routes/files-upload-post.ts:4-23`
- `packages/api/src/core/services/file.service.ts:50-72`
- `packages/api/src/routes/files-key-get.ts:5-22`
- `packages/api/src/server.ts:23-43`
- `packages/react/src/lib/file-upload.ts:3-22`

Anyone can upload an unlimited number of 10 MB objects without a form,
submission, capability, quota, or rate limit. The server trusts the
multipart-provided MIME type and later returns the bytes inline, on the main
application origin, with that same type. An attacker can upload HTML or SVG
and obtain an immutable, same-origin URL that can execute active content when
opened. There is also no deletion or expiry path, making anonymous storage and
egress exhaustion inexpensive.

Required direction:

1. Associate each upload with a valid form/submission upload capability.
2. Enforce server-side type policy using detected content, not only filename or
   client MIME type.
3. Serve user content from a separate untrusted origin, or force attachment
   download with `Content-Disposition`, `X-Content-Type-Options: nosniff`, and a
   restrictive CSP.
4. Add per-IP/per-form quotas and a retention/deletion policy.

Tests required: HTML/SVG cannot execute on the app origin; anonymous or expired
capabilities fail; per-file and aggregate limits are enforced; orphan cleanup
is covered.

## High-severity findings

### HIGH-01 — Public render responses disclose server-only connection configuration

Affected files:

- `packages/api/src/routes/forms-id-get.ts:13-25`
- `packages/api/src/routes/forms-slug-get.ts:31-45`
- `packages/api/src/core/services/form.service.ts:35-89`

Both managed forms and GitHub-backed forms return the complete definition to
respondents. That includes email recipients, message templates, webhook URLs,
and any bearer token or secret placed in a webhook query string. A registered
private-repository YAML file is therefore not private once its shareable form
ID is known.

Return a dedicated public/render definition that excludes `connections` and
other server-only settings. Keep the complete definition available only on
management endpoints. This public/private projection should be an explicit
core concept and have contract tests.

### HIGH-02 — The server does not enforce the form's validation or availability rules

Affected files:

- `packages/api/src/core/services/submission.service.ts:20-45`
- `packages/api/src/core/container.ts:83-87`
- `packages/api/src/core/strategies/email-verification-validation.strategy.ts:8-35`
- `packages/api/src/routes/forms-id-submissions-post.ts:15-37`
- `packages/web/src/pages/main.page.tsx:211-229`

The only server validation strategy is email OTP. Required fields, patterns,
lengths, numeric/date bounds, expression rules, field visibility, option
membership, form start/end dates, and unknown/oversized values are all trusted
to the browser. The project explicitly targets Zapier and agent/API clients,
so browser-only validation cannot be the authority.

OTP validation also skips an OTP field when its email value is absent. Because
required validation is not run on the server, omitting a required OTP email
bypasses both rules.

Add one core, framework-independent completed-submission validator and call it
from the API. Partial requests should still receive shape/size validation; a
completed request should validate all applicable visible fields and the form
availability window. Return field-level 422 details. Unknown fields need an
explicit allow/drop/reject policy.

### HIGH-03 — Submission state and connection delivery are not transactionally coherent

Affected files:

- `packages/api/src/core/services/submission.service.ts:47-99`
- `packages/api/src/core/strategies/webhook-connection.strategy.ts:14-20`
- `packages/api/src/core/strategies/email-connection.strategy.ts:82-87`

There are several related failure modes:

- a completed submission can be updated with `partial=true`, which changes its
  status back to `partial`; completing it again re-runs all connections;
- the submission is persisted before connections run;
- if a connection fails after persistence, retrying the same completed
  submission returns early and never retries the lost connection;
- if the initial completed create returns 500 after persistence, a retry
  without the newly created ID inserts a duplicate;
- `fetch()` does not treat a 4xx/5xx webhook response as failure and has no
  timeout; and
- the Resend SDK result is ignored even though delivery errors may be returned
  as data.

Before implementation, product should choose whether integrations are
best-effort or guaranteed. For this project's simplicity goal, a small
persisted delivery record with idempotency per
`submission + connection`, explicit attempt/error state, and a bounded retry
worker is preferable to pretending that the current synchronous request is
atomic. At minimum, never downgrade a completed submission and never silently
discard a delivery failure.

### HIGH-04 — Email verification can be used for spam and online OTP brute force

Affected files:

- `packages/api/src/routes/email-challenges-send-post.ts:19-48`
- `packages/api/src/routes/email-challenges-verify-post.ts:5-56`
- `packages/api/src/core/services/email-verification.service.ts:15-72`
- `packages/api/src/core/repositories/email-verification.repository.ts:4-27`

The public send endpoint accepts an arbitrary email and field ID, has no form
association or rate limit, and immediately uses the deployment's Resend
account. The returned request ID can then be tried against a six-digit code
without an attempt counter. Records remain reusable until expiry and remain in
MongoDB indefinitely because there is no delete or TTL index. Resend errors are
not inspected.

Require a valid form/field challenge request, rate-limit by IP and normalized
email, cap verification attempts, invalidate on success, and create a MongoDB
TTL index. Validate request bodies with route schemas and return a documented,
stable error shape.

### HIGH-05 — The generated progress URL is not actually resumable

Affected files:

- `packages/web/src/pages/main.page.tsx:32-79`
- `packages/web/src/pages/main.page.tsx:101-191`
- `packages/web/src/pages/main.page.tsx:231-245`

After every partial save the app writes `submission_id` and `step` to the URL.
On reload it starts at that step but initializes data only from arbitrary query
parameters; it never retrieves the saved submission. History is empty, prior
answers are absent from interpolation and conditional navigation, and the Back
button is unavailable. Subsequent saves happen to merge into the old server
record, which hides the loss until a condition depends on previous data.

Either implement a signed/capability-based resume read that restores data,
active section, and navigation history, or stop advertising/persisting a
resume URL. Do not expose the management-only submission read endpoint to solve
this.

### HIGH-06 — Selecting several files records only the last uploaded URL

Affected file: `packages/react/src/components/declarative-form/fields/file-upload/file-upload-field.component.tsx:42-144`

`handleFiles` captures `currentUrls` once. Each awaited upload resumes the same
closure and calls `onChange([...currentUrls, url])`, so a multi-file selection
replaces the previous result on each iteration. The UI metadata shows all
files, while the form value usually contains only the last one. The max-files
check is also performed once against stale metadata, so one batch can exceed
the configured maximum. Existing controller URLs are not hydrated into the
preview or count.

Build the next URL list locally, clamp the batch before uploading, commit it
once (or use a current ref), and derive displayed state from the controller
value. Add an interactive test for existing files, multiple selection,
removal, max limits, and partial upload failure.

### HIGH-07 — `FormRenderer` ignores replacement definitions and initial state

Affected files:

- `packages/react/src/components/declarative-form/core/use-runtime.ts:23-41`
- `packages/react/src/components/declarative-form/core/form.component.tsx:35-40`

Runtime state is initialized once. The effect lists `schema` as a dependency
but exits whenever the locale is unchanged, so a new definition,
`initialData`, or `initialSectionId` is ignored. The hosted web app masks part
of this with `key={formId}`, but an update to the same form ID remains stale,
and package consumers should not need a remount convention that the package
does not document.

Define the prop contract explicitly. If these are initialization-only props,
name/document them as such and expose a reset key. Preferably reset the runtime
when the definition identity/version changes and add a component update test.

### HIGH-08 — GitHub form IDs provide only 32 bits of identity

Affected files:

- `packages/api/src/core/services/form.service.ts:200-211`
- `packages/api/src/core/repositories/github-file.repository.ts:19-22`

Both public and private source IDs use the first eight hexadecimal characters
of MD5. At roughly 65,000 sources the birthday collision probability is
already material, and a chosen collision can overwrite the source mapping
because the repository upserts by ID. The same short value is also a weak
unlisted capability for a private source.

Use a substantially longer modern hash or a random server ID with a unique
compound source index. Treat `(owner, repository, path, ref, visibility)` as
the source identity and make collision behavior impossible at the database
constraint.

## Medium-severity findings

### MEDIUM-01 — Core validation is shallow and is not total over YAML input

Affected files:

- `packages/core/src/yaml.ts:4-11`
- `packages/core/src/validate-definition.ts:6-68`
- `packages/core/src/validation.ts:344-395`
- `packages/core/src/validation.ts:557-580`
- `packages/api/src/core/utils/form-definition.ts:37-96`

`parseFormYaml` verifies only that the root is an object. The public core
validator assumes arrays/objects and can throw on inputs such as a string
`sections` value rather than returning validation errors. The API adds a
partial shape guard, but the standalone package is the promised reusable
boundary and should be safe by itself.

Nested validators, options, connections, completion rules, dates, expression
syntax, version, and type-specific bounds are not validated. Invalid regular
expressions later throw from `new RegExp`, and very large rating bounds can
force large browser allocations. Validate the supported schema once in core,
keep the error messages path-oriented, and make compilation require a validated
definition (or fail predictably).

### MEDIUM-02 — Stateful fields do not reliably represent restored values

Affected files:

- `packages/react/src/components/declarative-form/fields/address-field.component.tsx:45-57`
- `packages/react/src/components/declarative-form/fields/address-field.component.tsx:103-170`
- `packages/react/src/components/declarative-form/fields/signature-field.component.tsx:24-35`
- `packages/react/src/components/declarative-form/fields/file-upload/file-upload-field.component.tsx:35-49`
- `packages/react/src/components/declarative-form/supporting/use-upload-blob.ts:7-34`

When Google Places is available, the address text state starts empty instead
of reflecting the controller value. File previews start empty even when URLs
exist. Signature state ignores an existing URL entirely and displays a blank
canvas. In addition, optional camera/file/signature uploads do not participate
in the form's saving state; a respondent can navigate away while an upload or
signature debounce is pending and persist a submission without that value.
The signature debounce is not cleared on unmount.

Treat the controller value as the source of truth, synchronize local display
state, and expose pending asynchronous field work to the section renderer so
navigation can wait. Cover back navigation, resume, remount, reset, and
optional-upload timing in tests.

### MEDIUM-03 — Values from fields that become hidden remain in the submission

Affected files:

- `packages/react/src/components/declarative-form/core/field.component.tsx:38-45`
- `packages/react/src/components/declarative-form/core/form.component.tsx:110-126`
- `packages/core/src/core/runtime.ts:103-170`

React Hook Form unregisters an invisible field, but the runtime merges the new
section data over its prior global data. An answer entered while visible is
therefore still sent after the respondent changes the controlling answer and
the field disappears. This is surprising and can retain sensitive data the
respondent reasonably believed they removed.

Choose a product rule and make it explicit. The usual form behavior is to
delete data when a field transitions to hidden. If retaining it is intended,
the UI and API contract should say so.

### MEDIUM-04 — Conditional navigation silently depends on rule ordering

Affected files:

- `packages/core/src/core/runtime.ts:11-33`
- `packages/core/src/validate-definition.ts:45-65`

`resolveNextSectionId` immediately returns the first `else` rule, even when a
later `when` rule would match. The validator neither requires `else` to be last
nor rejects multiple fallback rules. Either evaluate all `when` rules before
the fallback or validate/document `else-last`.

### MEDIUM-05 — Email response HTML is assembled without escaping respondent data

Affected file: `packages/api/src/core/strategies/email-connection.strategy.ts:11-35`

Labels and respondent values are concatenated directly into an HTML table.
Submitted HTML can alter the notification email, add deceptive links or remote
tracking, and break the table. Escape all labels and values before inserting
them into generated HTML. If authored connection bodies intentionally support
HTML, keep that trusted template path separate from untrusted response data.

### MEDIUM-06 — GitHub retrieval and registration lack operational limits

Affected files:

- `packages/api/src/core/gateways/github.ts:1-44`
- `packages/api/src/core/services/form.service.ts:92-126`
- `packages/web/src/pages/main.page.tsx:43-71`

Public reads have no request timeout, response-size limit, cache/ETag handling,
rate limit, or registration quota. React Query's default stale behavior can
re-fetch on focus, and every successful public path read writes an upsert.
Submission listing also re-fetches the source before reading already persisted
submissions, so a repository outage can hide historical data from an
administrator.

Add bounded fetches, a modest cache, and rate limits. Submission ownership
should be decided from persisted source metadata, not current GitHub
availability.

### MEDIUM-07 — Persistence has no indexes, retention, or referential cleanup

Affected files:

- `packages/api/src/core/repositories/form.repository.ts`
- `packages/api/src/core/repositories/github-file.repository.ts`
- `packages/api/src/core/repositories/submission.repository.ts`
- `packages/api/src/core/repositories/email-verification.repository.ts`
- `packages/api/src/core/services/managed-form.service.ts:23-29`

No startup migration creates unique IDs, common query indexes, or the email
verification TTL index. Deleting a form does not define what happens to its
submissions or uploaded files. Submission reads currently include MongoDB's
`_id` because their repository queries omit the projection used by the other
repositories.

Create a very small index/bootstrap module and document form-deletion and file
retention semantics. Project `_id` out of public response types.

### MEDIUM-08 — Proxy metadata does not match the shipped proxy

Affected files:

- `packages/api/src/routes/forms-id-submissions-post.ts:19-22`
- `packages/api/src/server.ts:22-31`
- `docker/compose.yaml`
- `docker/nginx.conf:10-15`

Submission metadata reads `do-connecting-ip`, but the shipped Traefik/Nginx
stack provides forwarded headers. Fastify is not configured with a trusted
proxy policy. Production IP metadata will therefore be empty or wrong. Enable
`trustProxy` only for the known proxy network and use Fastify's resolved
request IP; do not blindly trust arbitrary public forwarding headers.

### MEDIUM-09 — Self-host defaults can satisfy Compose while remaining insecure

Affected files:

- `.env.example`
- `docker/compose.yaml`
- `packages/api/src/main.ts`
- `packages/api/src/core/container.ts`

Compose's required-variable syntax accepts the checked-in placeholder API key,
JWT secret, Mongo password, and MinIO password. A new operator can bring up an
internet-facing stack with known credentials. The API does not validate
required environment values or placeholders at startup, and its health route
does not verify MongoDB or object storage.

Reject placeholder/short secrets at startup, split liveness from dependency
readiness, and make the quick-start generate credentials rather than tell the
operator to run `openssl` without assigning its output. Use a restricted MinIO
service user instead of the storage root credentials in the API.

### MEDIUM-10 — Security and privacy policy are hard-coded rather than operator-owned

Affected files:

- `packages/web/src/pages/privacy-policy.page.tsx`
- `packages/web/src/index.html`
- `packages/react/src/components/declarative-form/fields/geolocation/geolocation-map-preview.tsx`

The bundled privacy page makes legal assertions for every self-hoster ("we do
not sell") without operator identity, contact details, retention, lawful basis,
or configured processors. The renderer also loads Google Fonts, optional
Google Places, Mixpanel, and OpenStreetMap tiles; the OSM map explicitly
disables attribution. This is not a valid universal privacy policy.

Make legal text and external providers operator-configurable, set a suitable
referrer/CSP policy, restore required map attribution, and document which field
types contact third parties. A safe self-host default should avoid external
fonts/analytics/maps unless enabled.

### MEDIUM-11 — Locale changes are written to the URL but not applied reactively

Affected files:

- `packages/react/src/i18n/provider.tsx:5-31`
- `packages/web/src/pages/main.page.tsx:82-91`

`I18nProvider` reads the query string during render but has no browser-location
state. `MainPage` uses `history.replaceState` from a descendant, which does not
re-render the provider. The URL can change to the form locale while the current
UI remains in the old locale until reload. It also overwrites an explicit user
language with `form.locale`, which needs a documented precedence rule.

Keep locale in React state at the host boundary and pass it down explicitly.
Test query language, browser fallback, form default, navigation, and same-page
updates.

### MEDIUM-12 — Package/release details are incomplete for third-party reuse

Affected files:

- `packages/core/package.json`
- `packages/core/README.md`
- `packages/react/package.json`
- `packages/react/README.md`
- `packages/react/src/lib/api.ts`

Package dry-runs succeed, but neither tarball contains the repository's Apache
`LICENSE`. The READMEs do not describe supported schema versions, runtime
semantics, errors, browser requirements, async effects, or compatibility.
`configureRenderer` mutates a module-global API URL, so two renderer instances,
tests, or SSR requests cannot use independent backends.

Include a license in each published package, add minimal public contracts and
examples, and pass API behavior through a renderer/provider instance rather
than process-global mutable state.

## Lower-severity observations

### LOW-01 — OpenAPI is an outline, not yet an executable contract

`packages/api/openapi.yaml` parses, but it omits most request bodies and error
responses for email challenges, has very shallow form schemas, does not model
connection redaction, returns `200` for both create and update submissions
without documenting the distinction, and cannot represent slash-containing
GitHub wildcard paths with the current template. Fastify routes do not consume
the schemas, so implementation and documentation can drift.

### LOW-02 — Test coverage is too small for the size of the behavior surface

The suites contain 26 tests total (8 core, 3 React, 15 API). They establish the
new package split but do not exercise an interactive renderer, malformed nested
YAML, all field types, conditional fallback ordering, failed persistence,
connection trust, SSRF, upload security, OTP rate/attempt behavior, schema prop
changes, resuming, or Docker-level request flow. CI runs tests/build/container
builds but not web lint, API formatting, OpenAPI validation, dependency audit,
package dry-runs, or an end-to-end Compose smoke test.

### LOW-03 — Deployment images and frontend output are not reproducible or minimal

`docker/api.Dockerfile` copies the root workspace `node_modules` and full core
and API package trees into production after a root-workspace prune, retaining
more code/dependencies than the API needs. Node, Nginx, Traefik, and Mongo use
mutable minor tags rather than digests. Traefik mounts the Docker socket, and
the shipped routers do not add security headers or public endpoint rate limits.
The web build succeeds but warns about a 1.08 MB main JavaScript chunk. None is
as urgent as the trust issues above, but these should be recorded in the
self-host hardening backlog.

### LOW-04 — Local upload behavior differs from production

`docker/nginx.conf` does not set `client_max_body_size`, so the local web proxy
uses Nginx's smaller default while the API and production Traefik path allow 10
MB. Local API port 8081 bypasses that discrepancy, which can make tests depend
on the URL used.

### LOW-05 — Definition text is safely rendered, but the API name is misleading

`HtmlText` now relies on React text escaping, and the XSS regression test is
good. The prop is still named `html` and the component is exported as
`HtmlText`, which suggests HTML support that intentionally no longer exists.
Renaming it to plain/localized text in a future cleanup would make the safety
contract clearer.

## Product decisions needed

These decisions should be made before the corresponding fixes because they
change the public contract:

1. **Trust:** Are public GitHub URLs render-only? Recommended: yes; integrations
   require an API-key-authenticated registration.
2. **Files:** Are respondent files public forever, private behind a capability,
   or accessible only through management APIs? Recommended: separate untrusted
   origin plus expiring upload capability and documented retention.
3. **Delivery:** Are webhooks/email best-effort or guaranteed? Recommended:
   persisted delivery status with bounded retries and visible failures.
4. **Resume:** Is `submission_id` intended to be a respondent capability?
   Recommended: yes, but use a separate high-entropy resume token and restore
   data/history; never reuse the management read API.
5. **Hidden answers:** Delete values when a field becomes invisible, or retain
   them? Recommended: delete to match respondent expectation.
6. **Deletion:** Does deleting a form cascade, soft-delete, or retain
   submissions/files? This must be explicit for self-hosters and privacy policy.

## Recommended repair sequence

1. Close the two critical public abuse paths and split public render data from
   trusted server configuration.
2. Add authoritative server submission validation, availability checks, OTP
   controls, and public endpoint rate limits.
3. Make completed submission state monotonic and define persisted connection
   delivery semantics.
4. Repair resume behavior and the React runtime/file/state synchronization
   defects; add interactive tests before changing more field components.
5. Add database indexes/retention, startup environment validation, readiness,
   and proxy correctness.
6. Align OpenAPI and docs with the trust model, then harden/package the
   self-host distribution.

## Verification performed

| Check | Result |
| --- | --- |
| `npm test` | Passed: 8 core, 3 React, 15 API tests |
| `npm run build` | Passed for core, React, API, and web |
| `npm run lint --workspace=@declarativeforms/web` | Passed |
| `git diff --check main...HEAD` | Passed |
| OpenAPI YAML parse | Passed |
| `docker-compose --env-file .env.example -f docker/compose.yaml config --quiet` | Passed |
| `npm pack --dry-run` for core and React | Passed with isolated cache; exposed missing package license |
| Web production bundle | Built; main chunk warning at 1.08 MB (324.75 kB gzip) |

The first package dry-run attempt hit an existing user npm-cache ownership
problem outside the repository. Re-running with an isolated cache succeeded.
No source file was changed by verification.

## File-by-file review ledger

Legend:

- **Accept** — purpose and implementation are appropriate for this change.
- **Follow up** — acceptable direction, but associated with a finding above.
- **Block** — participates directly in a release-blocking finding.
- **Remove** — deletion is intentional and consistent with removing Studio or
  collapsing the old package layout.
- **Move** — primarily a relocation; implementation concerns are called out
  against the destination where applicable.

### Repository, documentation, CI, and self-hosting

| Path | Disposition | Review note |
| --- | --- | --- |
| `.dockerignore` | Accept | Excludes repository, secrets, dependencies, build outputs, docs, and local review files from the root build context. |
| `.env.example` | Follow up | Clear variable grouping, but known placeholder secrets pass Compose's required checks; see MEDIUM-09. |
| `.github/workflows/deploy.yaml` | Follow up | Good CI rename and container validation; add lint, OpenAPI/contract checks, and smoke/security checks from LOW-02. |
| `LICENSE` | Accept | Correct Apache-2.0 root license; published package tarballs still need a copy. |
| `README.md` | Follow up | Explains the new architecture and self-host flow well; credential generation command is incomplete and security/trust/retention semantics need correction. |
| `docker/api.Dockerfile` | Follow up | Multi-stage and non-root runtime are good; production copy/prune is broader than necessary and tags are mutable (LOW-03). |
| `docker/api.Dockerfile.dockerignore` | Accept | Appropriate Dockerfile-specific exclusions. |
| `docker/compose.local.yaml` | Follow up | Useful local ports and same-origin file URL; local Nginx upload limit differs from API (LOW-04). |
| `docker/compose.yaml` | Follow up | Sound network/TLS topology; placeholder secrets, root MinIO credentials, proxy policy, hardening, and mutable images remain. |
| `docker/nginx.conf` | Follow up | Correct SPA and API routing; add local upload limit parity and security headers. |
| `docker/web.Dockerfile` | Follow up | Clear multi-stage static build; pin base image and consider non-root/hardened Nginx. |
| `docker/web.Dockerfile.dockerignore` | Accept | Appropriate Dockerfile-specific exclusions. |
| `docs/field-types/address-fields.mdx` | Follow up | Correctly explains fallback/structured output, but exceeds the local minimal field-doc convention and does not warn about restored-value behavior. |
| `docs/getting-started/create-a-form.mdx` | Block | Documents untrusted public email connections and mixes hosted `frms.dev` claims with self-host setup; see CRITICAL-01 and MEDIUM-10. |
| `package-lock.json` | Accept | Workspace graph is internally consistent and builds; large mechanical lockfile change corresponds to removed workspaces/new package. |
| `package.json` | Accept | Simple dependency-ordered scripts and four-workspace model match the architecture. |
| `tsconfig.json` | Accept | Project references make the core → React/API → web dependency direction explicit. |

### API package

| Path | Disposition | Review note |
| --- | --- | --- |
| `packages/api/Dockerfile` | Remove | Old package-local image definition is superseded by `docker/api.Dockerfile`. |
| `packages/api/jest.config.cjs` | Accept | Core source mapping supports package-local tests. |
| `packages/api/openapi.yaml` | Follow up | Valuable initial contract, but incomplete and not enforced; see LOW-01. |
| `packages/api/package.json` | Accept | Studio/auth dependencies are removed and core is the only internal dependency. |
| `packages/api/src/core/container.ts` | Follow up | Dependency assembly is easy to trace; needs startup env validation, index bootstrap, readiness, and concurrent initialization protection. |
| `packages/api/src/core/gateways/github.ts` | Follow up | Correct URL encoding and server token use; add timeouts, size bounds, cache/ETag and differentiated failure handling (MEDIUM-06). |
| `packages/api/src/core/repositories/form.repository.ts` | Follow up | Small and readable CRUD repository; add unique/index bootstrap and deletion semantics. |
| `packages/api/src/core/repositories/github-file.repository.ts` | Follow up | Correctly projects the legacy token; ID-only upsert permits short-hash collision overwrite. |
| `packages/api/src/core/repositories/index.ts` | Accept | Barrel accurately exports the remaining repositories. |
| `packages/api/src/core/repositories/studio-form.repository.ts` | Remove | Studio-specific persistence removed as requested. |
| `packages/api/src/core/repositories/submission.repository.ts` | Follow up | Straightforward persistence, but lacks `_id` projection, indexes, optimistic concurrency, and delivery state. |
| `packages/api/src/core/services/auth.service.ts` | Remove | Studio user/session authentication is outside the new API-only product. |
| `packages/api/src/core/services/email-verification.service.ts` | Follow up | Cryptographic token generation/hash are appropriate; add attempts, single use, normalized email, and cleanup. |
| `packages/api/src/core/services/file.service.ts` | Block | Clean S3 wrapper, but trusts MIME and creates permanent same-origin public objects (CRITICAL-02). |
| `packages/api/src/core/services/form.service.test.ts` | Follow up | Covers token handling/source registration; add collision, trust, timeout, and public-effect tests. |
| `packages/api/src/core/services/form.service.ts` | Block | Central form resolution is understandable, but anonymously registers trusted/executable sources and uses 32-bit IDs. |
| `packages/api/src/core/services/index.ts` | Accept | Barrel matches the reduced service set. |
| `packages/api/src/core/services/managed-form.service.test.ts` | Accept | Verifies server ownership of ID/timestamps and update preservation. |
| `packages/api/src/core/services/managed-form.service.ts` | Follow up | Simple whole-document replacement is a good API; define cascading/retention behavior and database uniqueness. |
| `packages/api/src/core/services/studio-form.service.ts` | Remove | Studio ownership/collaborator service correctly removed. |
| `packages/api/src/core/services/submission.service.test.ts` | Follow up | Establishes partial-versus-complete effect behavior only; lifecycle/idempotency/failure tests are essential. |
| `packages/api/src/core/services/submission.service.ts` | Block | The service is the right orchestration point, but trusts client validation and has unsafe connection/state semantics. |
| `packages/api/src/core/services/templates/magic-link-email.html` | Remove | Magic-link Studio login is no longer part of the product. |
| `packages/api/src/core/strategies/email-connection.strategy.ts` | Block | Strategy isolation is good; untrusted recipients, unescaped response HTML, and ignored delivery results are unsafe. |
| `packages/api/src/core/strategies/email-verification-validation.strategy.test.ts` | Follow up | Covers token/email match; add missing required email, expiry, absent secret, field/form scope, and partial behavior. |
| `packages/api/src/core/strategies/email-verification-validation.strategy.ts` | Follow up | Small JWT verification strategy; absent values bypass OTP and tokens are not form/field scoped. |
| `packages/api/src/core/strategies/index.ts` | Accept | Strategy interfaces and exports remain compact and understandable. |
| `packages/api/src/core/strategies/webhook-connection.strategy.ts` | Block | Direct arbitrary `fetch` is an SSRF primitive and does not inspect status or timeout. |
| `packages/api/src/core/types/github-file.ts` | Accept | Replaces per-user token with server-side `private/ref` source metadata. |
| `packages/api/src/core/types/index.ts` | Accept | Exports only current API domain types. |
| `packages/api/src/core/types/managed-form.ts` | Accept | Server timestamp/ID extension is clear and minimal. |
| `packages/api/src/core/types/user.ts` | Remove | Studio user model correctly removed. |
| `packages/api/src/core/utils/form-definition.test.ts` | Follow up | Good duplicate/type/navigation cases; nested malformed and type-specific schemas remain untested. |
| `packages/api/src/core/utils/form-definition.ts` | Follow up | Useful API boundary and metadata stripping, but duplicates only part of the schema guard that belongs in core. |
| `packages/api/src/core/utils/index.ts` | Accept | Barrel no longer exports Studio authorization parsing. |
| `packages/api/src/core/utils/parse-authorization-header.ts` | Remove | Obsolete Studio token parser replaced by focused API-key middleware. |
| `packages/api/src/job.ts` | Remove | Firebase/background job entrypoint is no longer used by self-hosted API. |
| `packages/api/src/main.test.ts` | Follow up | Good health/auth/Studio-removal smoke tests; add route schemas and public/private trust assertions. |
| `packages/api/src/main.ts` | Follow up | Minimal entrypoint is good; validate environment before listening and handle shutdown signals. |
| `packages/api/src/middleware/index.ts` | Accept | Exports only current middleware. |
| `packages/api/src/middleware/require-api-key.ts` | Accept | Intentionally simple Bearer parsing and constant-time comparison; suitable for the stated single-operator model. |
| `packages/api/src/middleware/require-studio-auth.ts` | Remove | Studio/Firebase authorization correctly removed. |
| `packages/api/src/routes/auth-demo-post.ts` | Remove | Demo Studio authentication endpoint removed. |
| `packages/api/src/routes/auth-github-post.ts` | Remove | GitHub Studio sign-in endpoint removed. |
| `packages/api/src/routes/auth-magic-link-send-post.ts` | Remove | Studio magic-link endpoint removed. |
| `packages/api/src/routes/auth-magic-link-verify-post.ts` | Remove | Studio magic-link verification endpoint removed. |
| `packages/api/src/routes/auth-me-get.ts` | Remove | Studio current-user endpoint removed. |
| `packages/api/src/routes/email-challenges-verify-post.ts` | Follow up | Small route, but body is unvalidated and challenge attempts/single use are not enforced. |
| `packages/api/src/routes/error-response.ts` | Accept | Centralizes consistent not-found/definition errors without unnecessary layering. |
| `packages/api/src/routes/files-key-get.ts` | Block | Immutable file reads are simple, but inline client MIME on the app origin creates stored active-content risk. |
| `packages/api/src/routes/forms-get.ts` | Accept | Protected managed-form listing is concise and correctly scoped. |
| `packages/api/src/routes/forms-github-post.ts` | Follow up | Correct protected private-source registration and token handling; input bounds/source uniqueness are still needed. |
| `packages/api/src/routes/forms-id-delete.ts` | Follow up | Correct protected route; retention/cascade behavior is undefined. |
| `packages/api/src/routes/forms-id-get.ts` | Follow up | Public renderer lookup is needed, but must project out connections/server configuration. |
| `packages/api/src/routes/forms-id-put.ts` | Accept | Protected whole-definition replacement and errors are clear. |
| `packages/api/src/routes/forms-id-submissions-get.ts` | Follow up | Protected read is correct; should not depend on live GitHub availability and needs pagination. |
| `packages/api/src/routes/forms-id-submissions-id-get.ts` | Accept | Protected form-scoped lookup is appropriately small; repository should hide Mongo `_id`. |
| `packages/api/src/routes/forms-id-submissions-post.ts` | Block | Public write is required, but lacks authoritative validation/rate limits and reads the wrong proxy header. |
| `packages/api/src/routes/forms-post.ts` | Accept | Protected create delegates validation and server metadata ownership cleanly. |
| `packages/api/src/routes/forms-slug-get.ts` | Block | Public GitHub rendering is core functionality; anonymous registration must not grant server-effect trust. |
| `packages/api/src/routes/index.ts` | Accept | Route barrel accurately excludes all Studio and OAuth endpoints. |
| `packages/api/src/routes/oauth-github-access-token-post.ts` | Remove | Browser OAuth/token exchange is unnecessary after Studio removal. |
| `packages/api/src/routes/studio-forms-get.ts` | Remove | Studio list endpoint removed. |
| `packages/api/src/routes/studio-forms-id-delete.ts` | Remove | Studio delete endpoint removed. |
| `packages/api/src/routes/studio-forms-id-get.ts` | Remove | Studio read endpoint removed. |
| `packages/api/src/routes/studio-forms-id-put.ts` | Remove | Studio update endpoint removed. |
| `packages/api/src/routes/studio-forms-id-submissions-get.ts` | Remove | Studio submission read endpoint replaced by protected public API shape. |
| `packages/api/src/routes/studio-forms-post.ts` | Remove | Studio create endpoint replaced by protected management API. |
| `packages/api/src/server.ts` | Follow up | Route protection is visibly centralized; add schemas, rate limits, trusted proxy, security headers, and dependency readiness. |
| `packages/api/tsconfig.json` | Accept | CommonJS build and core reference match Node runtime. |

### Framework-independent core and collapsed legacy packages

| Path | Disposition | Review note |
| --- | --- | --- |
| `packages/common/package.json` | Remove | Responsibilities were absorbed into the public core package. |
| `packages/common/src/expression.ts` | Remove | Replaced by the safer AST evaluator in `packages/core/src/expression.ts`. |
| `packages/common/src/index.ts` | Remove | Obsolete barrel after package collapse. |
| `packages/common/tsconfig.json` | Remove | Obsolete project reference after package collapse. |
| `packages/core/.env` | Remove | Firebase/frontend environment file does not belong in the reusable core package. |
| `packages/core/.firebaserc` | Remove | Firebase deployment metadata correctly removed. |
| `packages/core/README.md` | Follow up | Clear minimal entry point; needs the public validation/error/version contract described in MEDIUM-12. |
| `packages/core/firebase.json` | Remove | Core is no longer a Firebase-hosted application. |
| `packages/core/jest.config.cjs` | Accept | Minimal TypeScript/Jest configuration for framework-independent tests. |
| `packages/core/package.json` | Follow up | Publishable boundary and small dependencies are good; package tarball lacks `LICENSE`. |
| `packages/core/src/App.tsx` | Remove | React application shell correctly removed from framework-independent core. |
| `packages/types/src/common.ts` → `packages/core/src/address.ts` | Move | Address value type is correctly colocated with core definitions; consider replacing legacy `I*` naming in a future breaking release. |
| `packages/runtime/src/compilation/completion.ts` → `packages/core/src/compilation/completion.ts` | Follow up | Clean conditional completion compiler; fallback ordering should be validated/documented consistently. |
| `packages/runtime/src/compilation/defaults.ts` → `packages/core/src/compilation/defaults.ts` | Accept | Small default-value projection belongs in core. |
| `packages/runtime/src/compilation/field.ts` → `packages/core/src/compilation/field.ts` | Follow up | Correct compiled-field boundary; relies on shallow input validation and can compile empty IDs/options. |
| `packages/runtime/src/compilation/form.ts` → `packages/core/src/compilation/form.ts` | Accept | Produces the intended single-section `FormView` and keeps raw sections out of the renderer contract. |
| `packages/runtime/src/compilation/section.ts` → `packages/core/src/compilation/section.ts` | Accept | Direct, readable field compilation with no unnecessary layer. |
| `packages/core/src/components/declarative-form/core/form.component.tsx` | Remove | Renderer implementation moved out of framework-independent core. |
| `packages/core/src/components/declarative-form/core/index.ts` | Remove | Obsolete React barrel in core. |
| `packages/core/src/components/declarative-form/fields/email/constants.ts` | Remove | Renderer-specific OTP endpoint constants moved to React. |
| `packages/core/src/components/index.ts` | Remove | Obsolete React component barrel. |
| `packages/core/src/components/ui/card.tsx` | Remove | UI primitive moved to React package. |
| `packages/core/src/components/ui/input.tsx` | Remove | UI primitive moved to React package. |
| `packages/core/src/components/ui/select.tsx` | Remove | UI primitive moved to React package. |
| `packages/core/src/components/ui/textarea.tsx` | Remove | UI primitive moved to React package. |
| `packages/types/src/connection.ts` → `packages/core/src/connection.ts` | Move | Connection runtime types now sit with definitions; public/trusted connection separation is still missing. |
| `packages/core/src/core.test.ts` | Follow up | Good architecture/safe-expression smoke tests; broaden malformed input, navigation, validation, and state coverage. |
| `packages/runtime/src/core/runtime.ts` → `packages/core/src/core/runtime.ts` | Follow up | Pure transition function is the right design; else ordering and hidden-value retention need correction. |
| `packages/runtime/src/create-form-runtime.ts` → `packages/core/src/create-form-runtime.ts` | Accept | Thin stateful wrapper over pure transitions is easy for non-React hosts to use. |
| `packages/types/src/form.ts` → `packages/core/src/definition.ts` | Follow up | Central schema vocabulary is intuitive, but pervasive optional fields make unvalidated definitions look valid to TypeScript. |
| `packages/core/src/expression.ts` | Accept | AST allowlist and denied prototype keys are a substantial safety improvement over dynamic evaluation. |
| `packages/core/src/index.css` | Remove | Presentation moved to the React package. |
| `packages/runtime/src/index.ts` → `packages/core/src/index.ts` | Accept | Public exports expose parse/compile/runtime/types from one obvious entry point. |
| `packages/core/src/lib/api.ts` | Remove | API URL configuration is renderer/host behavior, not core behavior. |
| `packages/common/src/localization.ts` → `packages/core/src/localization.ts` | Accept | Locale resolution is small and appropriately framework independent. |
| `packages/runtime/src/messages.ts` → `packages/core/src/messages.ts` | Accept | Core validation messages and injection point are appropriately colocated. |
| `packages/core/src/pages/oauth-github.page.tsx` | Remove | OAuth page removed with Studio/Firebase application. |
| `packages/core/src/pages/thank-you.page.tsx` | Remove | Completion presentation belongs in renderer, not core. |
| `packages/common/src/strip-html.ts` → `packages/core/src/strip-html.ts` | Follow up | Tiny utility is acceptable, though regex stripping is not an HTML sanitizer and should not be described as one. |
| `packages/types/src/submission.ts` → `packages/core/src/submission.ts` | Move | Shared submission shape is useful; delivery/resume state will likely require an explicit versioned extension. |
| `packages/common/src/template.ts` → `packages/core/src/template.ts` | Accept | Central Handlebars interpolation is useful; safety depends on each output context and must be documented. |
| `packages/runtime/src/types.ts` → `packages/core/src/types.ts` | Accept | Compiled view/action/effect types make the package flow legible. |
| `packages/core/src/validate-definition.ts` | Follow up | Right public API and clear path messages; incomplete/throwing shape behavior is MEDIUM-01. |
| `packages/runtime/src/validation.ts` → `packages/core/src/validation.ts` | Follow up | Shared validation is the correct location; regex/type bounds and server-wide submission validation need work. |
| `packages/core/src/yaml.ts` | Follow up | Minimal parser is readable; must either validate deeply or return an explicitly unvalidated type. |
| `packages/core/tsconfig.app.json` | Remove | Browser-application compiler config is obsolete in core. |
| `packages/core/tsconfig.json` | Accept | Strict CommonJS library build, declarations, and project references are appropriate. |
| `packages/core/vite.config.ts` | Remove | Framework-independent core no longer needs an application bundler. |
| `packages/runtime/package.json` | Remove | Runtime is now part of the single understandable core package. |
| `packages/runtime/tsconfig.json` | Remove | Obsolete project after runtime collapse. |
| `packages/types/package.json` | Remove | Types are now exported by the package that owns the behavior. |
| `packages/types/src/index.ts` | Remove | Obsolete types barrel. |
| `packages/types/tsconfig.json` | Remove | Obsolete project after type collapse. |

### React rendering package

| Path | Disposition | Review note |
| --- | --- | --- |
| `packages/react/README.md` | Follow up | Shows component override clearly; document runtime reset, effects, API configuration, browser globals, and supported field behavior. |
| `packages/react/jest.config.cjs` | Follow up | Source mapping/assets are correct; Node-only environment cannot exercise interactive field behavior. |
| `packages/react/package.json` | Follow up | Publishable ESM/CSS exports and React peers are good; include `LICENSE` and consider narrower runtime dependencies/peer ranges. |
| `packages/react/src/assets.d.ts` | Accept | Required declarations for bundled Leaflet image imports. |
| `packages/core/src/components/declarative-form/core/field-registry.ts` → `packages/react/src/components/declarative-form/core/field-registry.ts` | Accept | Simple complete default registry plus partial overrides is exactly the intended extension point. |
| `packages/core/src/components/declarative-form/core/field.component.tsx` → `packages/react/src/components/declarative-form/core/field.component.tsx` | Follow up | Good generic Controller boundary and error isolation; unregister does not remove old runtime data (MEDIUM-03). |
| `packages/react/src/components/declarative-form/core/form.component.tsx` | Follow up | Clear host-facing renderer/effect contract; optimistic transition/rollback and runtime reset semantics need correction. |
| `packages/react/src/components/declarative-form/core/index.ts` | Accept | Exposes renderer, view renderer, registry, and aliases without leaking internals. |
| `packages/core/src/components/declarative-form/core/section.component.tsx` → `packages/react/src/components/declarative-form/core/section.component.tsx` | Follow up | Good one-section React Hook Form boundary; async field work and hidden-value removal are not coordinated. |
| `packages/core/src/components/declarative-form/core/use-runtime.ts` → `packages/react/src/components/declarative-form/core/use-runtime.ts` | Follow up | Useful hook over pure core transitions; replacement schema/initial props are ignored (HIGH-07). |
| `packages/core/src/components/declarative-form/fields/address-field.component.tsx` → `packages/react/src/components/declarative-form/fields/address-field.component.tsx` | Follow up | Good text fallback and provider isolation; controller/restored values do not initialize autocomplete display. |
| `packages/core/src/components/declarative-form/fields/camera-field.component.tsx` → `packages/react/src/components/declarative-form/fields/camera-field.component.tsx` | Follow up | Stream cleanup and error states are thoughtful; optional uploads can outlive navigation and local state does not react to external reset. |
| `packages/core/src/components/declarative-form/fields/dropdown-field.component.tsx` → `packages/react/src/components/declarative-form/fields/dropdown-field.component.tsx` | Accept | Readable native/searchable variants; definition validation should prevent duplicate/empty values. |
| `packages/core/src/components/declarative-form/fields/email-field.component.tsx` → `packages/react/src/components/declarative-form/fields/email-field.component.tsx` | Follow up | OTP UX and token invalidation on email edit are sensible; backend challenge abuse and renderer-global API config remain. |
| `packages/core/src/components/declarative-form/fields/email/api.ts` → `packages/react/src/components/declarative-form/fields/email/api.ts` | Follow up | Handles response variants/errors defensively; requests need form identity and abort/timeout support. |
| `packages/react/src/components/declarative-form/fields/email/constants.ts` | Accept | Keeps endpoint paths and default cooldown in one renderer-local place. |
| `packages/core/src/components/declarative-form/fields/email/free-email-domains.ts` → `packages/react/src/components/declarative-form/fields/email/free-email-domains.ts` | Follow up | Deterministic client list; server does not enforce the same rule and the list will age. |
| `packages/core/src/components/declarative-form/fields/email/utils.ts` → `packages/react/src/components/declarative-form/fields/email/utils.ts` | Accept | Focused conversion/email/OTP helpers. |
| `packages/core/src/components/declarative-form/fields/email/validation.ts` → `packages/react/src/components/declarative-form/fields/email/validation.ts` | Follow up | Clean React Hook Form extension; OTP-required applies client-side only and empty email interaction depends on other rules. |
| `packages/core/src/components/declarative-form/fields/file-upload/file-preview.component.tsx` → `packages/react/src/components/declarative-form/fields/file-upload/file-preview.component.tsx` | Accept | Accessible status/remove presentation; preview metadata should be derived from persisted values. |
| `packages/core/src/components/declarative-form/fields/file-upload/file-upload-field.component.tsx` → `packages/react/src/components/declarative-form/fields/file-upload/file-upload-field.component.tsx` | Block | Multi-file state corruption, stale max checks, missing hydration, and untrusted upload dependency; see HIGH-06/CRITICAL-02. |
| `packages/core/src/components/declarative-form/fields/geolocation/geolocation-field.component.tsx` → `packages/react/src/components/declarative-form/fields/geolocation/geolocation-field.component.tsx` | Follow up | Good permission/error/refinement flow; restored shape guard checks keys but not numeric values, and external map privacy is implicit. |
| `packages/core/src/components/declarative-form/fields/geolocation/geolocation-map-preview.tsx` → `packages/react/src/components/declarative-form/fields/geolocation/geolocation-map-preview.tsx` | Follow up | Lazy map split is useful; restore OSM attribution and make tile provider/external request configurable. |
| `packages/core/src/components/declarative-form/fields/hidden-field.component.tsx` → `packages/react/src/components/declarative-form/fields/hidden-field.component.tsx` | Accept | Correctly delegates hidden value to form state; query-provided values must not be treated as trusted by server integrations. |
| `packages/core/src/components/declarative-form/fields/index.ts` → `packages/react/src/components/declarative-form/fields/index.ts` | Accept | Field exports match the registry. |
| `packages/core/src/components/declarative-form/fields/input-field.component.tsx` → `packages/react/src/components/declarative-form/fields/input-field.component.tsx` | Accept | Centralized native input mapping is compact; core should validate field-specific bounds and number semantics. |
| `packages/core/src/components/declarative-form/fields/long-text-field.component.tsx` → `packages/react/src/components/declarative-form/fields/long-text-field.component.tsx` | Accept | Straightforward textarea adapter with shared bounds. |
| `packages/core/src/components/declarative-form/fields/multiple-select-field.component.tsx` → `packages/react/src/components/declarative-form/fields/multiple-select-field.component.tsx` | Follow up | Clear option UI; empty “other” counts as a selection and unknown-value representation is ambiguous. |
| `packages/core/src/components/declarative-form/fields/rating-field.component.tsx` → `packages/react/src/components/declarative-form/fields/rating-field.component.tsx` | Follow up | Simple radio-grid implementation; unbounded definition ranges can allocate/render an excessive list. |
| `packages/core/src/components/declarative-form/fields/secondary-token-field.ts` → `packages/react/src/components/declarative-form/fields/secondary-token-field.ts` | Accept | Centralizes the hidden OTP-token naming convention; reserve/validate collisions with authored field IDs. |
| `packages/core/src/components/declarative-form/fields/signature-field.component.tsx` → `packages/react/src/components/declarative-form/fields/signature-field.component.tsx` | Follow up | Canvas implementation is readable; ignores restored URL, does not clear pending debounce on unmount, and optional submit can race upload. |
| `packages/core/src/components/declarative-form/fields/single-select-field.component.tsx` → `packages/react/src/components/declarative-form/fields/single-select-field.component.tsx` | Follow up | Clear “other” mode; reserved sentinel/empty other values need schema and validation rules. |
| `packages/core/src/components/declarative-form/index.ts` → `packages/react/src/components/declarative-form/index.ts` | Accept | Package-local renderer barrel is appropriate. |
| `packages/core/src/components/declarative-form/scaffolding/hero-section.component.tsx` → `packages/react/src/components/declarative-form/scaffolding/hero-section.component.tsx` | Accept | Small reusable empty/error state with theme support. |
| `packages/core/src/components/declarative-form/supporting/field-error-boundary.component.tsx` → `packages/react/src/components/declarative-form/supporting/field-error-boundary.component.tsx` | Follow up | Prevents whole-form crashes; a failed required field becomes impossible to complete and needs diagnostics/host callback. |
| `packages/core/src/components/declarative-form/supporting/field-support.ts` → `packages/react/src/components/declarative-form/supporting/field-support.ts` | Accept | Minimal custom renderer prop contract at the right abstraction. |
| `packages/core/src/components/declarative-form/supporting/html-text.tsx` → `packages/react/src/components/declarative-form/supporting/html-text.tsx` | Accept | React escaping closes the prior HTML injection class; rename later for clarity (LOW-05). |
| `packages/core/src/components/declarative-form/supporting/types.ts` → `packages/react/src/components/declarative-form/supporting/types.ts` | Accept | Renderer field type aliases correctly derive from core. |
| `packages/core/src/components/declarative-form/supporting/use-form-i18n.ts` → `packages/react/src/components/declarative-form/supporting/use-form-i18n.ts` | Accept | Thin hook alias keeps field code readable. |
| `packages/core/src/components/declarative-form/supporting/use-upload-blob.ts` → `packages/react/src/components/declarative-form/supporting/use-upload-blob.ts` | Follow up | Useful shared upload state; no cancellation/unmount handling and pending state is not lifted to the form. |
| `packages/core/src/components/declarative-form/supporting/use-wait-for-global.ts` → `packages/react/src/components/declarative-form/supporting/use-wait-for-global.ts` | Follow up | Bounded polling is simple; after timeout it never notices a provider loaded later. |
| `packages/core/src/components/declarative-form/supporting/validation.ts` → `packages/react/src/components/declarative-form/supporting/validation.ts` | Follow up | Correct adapter from core rules to React Hook Form; invalid regex can throw during render. |
| `packages/core/src/components/ui/button.tsx` → `packages/react/src/components/ui/button.tsx` | Move | Standard renderer-owned primitive; no branch-specific issue. |
| `packages/studio/src/components/ui/card.tsx` → `packages/react/src/components/ui/card.tsx` | Move | Shared card retained in renderer after Studio deletion; no branch-specific issue. |
| `packages/core/src/components/ui/checkbox.tsx` → `packages/react/src/components/ui/checkbox.tsx` | Move | Standard renderer-owned primitive; no branch-specific issue. |
| `packages/core/src/components/ui/collapsible.tsx` → `packages/react/src/components/ui/collapsible.tsx` | Move | Standard renderer-owned primitive; no branch-specific issue. |
| `packages/core/src/components/ui/command.tsx` → `packages/react/src/components/ui/command.tsx` | Move | Standard command palette primitive used by searchable fields. |
| `packages/core/src/components/ui/dialog.tsx` → `packages/react/src/components/ui/dialog.tsx` | Move | Standard renderer-owned primitive; currently exported beyond immediate form needs. |
| `packages/core/src/components/ui/field.tsx` → `packages/react/src/components/ui/field.tsx` | Move | Field/error layout appropriately moved with renderer. |
| `packages/core/src/components/ui/index.ts` → `packages/react/src/components/ui/index.ts` | Accept | UI barrel matches renderer imports. |
| `packages/studio/src/components/ui/input.tsx` → `packages/react/src/components/ui/input.tsx` | Move | Standard input retained for built-in fields. |
| `packages/core/src/components/ui/label.tsx` → `packages/react/src/components/ui/label.tsx` | Move | Standard label retained for accessibility structure. |
| `packages/core/src/components/ui/popover.tsx` → `packages/react/src/components/ui/popover.tsx` | Move | Standard popover retained for address/searchable dropdown. |
| `packages/core/src/components/ui/radio-group.tsx` → `packages/react/src/components/ui/radio-group.tsx` | Move | Standard radio primitive retained for selection/rating fields. |
| `packages/studio/src/components/ui/select.tsx` → `packages/react/src/components/ui/select.tsx` | Move | Standard select retained for built-in dropdown. |
| `packages/core/src/components/ui/separator.tsx` → `packages/react/src/components/ui/separator.tsx` | Move | Standard renderer-owned primitive; no branch-specific issue. |
| `packages/core/src/components/ui/tabs.tsx` → `packages/react/src/components/ui/tabs.tsx` | Move | Standard primitive is exported though not essential to the core form flow. |
| `packages/studio/src/components/ui/textarea.tsx` → `packages/react/src/components/ui/textarea.tsx` | Move | Standard textarea retained for long-text field. |
| `packages/core/src/hooks/useDebounce.ts` → `packages/react/src/hooks/useDebounce.ts` | Move | Small renderer-only hook is correctly relocated. |
| `packages/core/src/i18n/context.ts` → `packages/react/src/i18n/context.ts` | Move | React context belongs with the renderer. |
| `packages/core/src/i18n/index.ts` → `packages/react/src/i18n/index.ts` | Accept | I18n exports are appropriately narrow. |
| `packages/core/src/i18n/locales.ts` → `packages/react/src/i18n/locales.ts` | Follow up | Explicit supported locale list is clear; form locale/user locale precedence needs a contract. |
| `packages/core/src/i18n/messages/en.ts` → `packages/react/src/i18n/messages/en.ts` | Accept | English catalog covers renderer states and provides the key type. |
| `packages/core/src/i18n/messages/es.ts` → `packages/react/src/i18n/messages/es.ts` | Accept | Spanish catalog mirrors the English keys. |
| `packages/core/src/i18n/provider.tsx` → `packages/react/src/i18n/provider.tsx` | Follow up | Small provider, but URL-derived locale is non-reactive (MEDIUM-11). |
| `packages/core/src/i18n/runtime.ts` → `packages/react/src/i18n/runtime.ts` | Accept | Locale normalization and fallback logic are understandable. |
| `packages/core/src/i18n/use-i18n.ts` → `packages/react/src/i18n/use-i18n.ts` | Accept | Correct strict context hook. |
| `packages/react/src/index.ts` | Follow up | Public surface is concise; exports many UI primitives and global API configuration that enlarge compatibility obligations. |
| `packages/react/src/lib/api.ts` | Follow up | Tiny and convenient, but module-global mutation prevents renderer-instance isolation. |
| `packages/core/src/lib/file-upload.ts` → `packages/react/src/lib/file-upload.ts` | Block | Upload transport is correctly out of core, but targets the unsafe anonymous upload API and trusts response shape. |
| `packages/core/src/lib/google-places.ts` → `packages/react/src/lib/google-places.ts` | Follow up | Provider adapter is isolated well; errors are logged twice and provider loading/configuration remains implicit host work. |
| `packages/core/src/lib/theme.ts` → `packages/react/src/lib/theme.ts` | Accept | Small constrained CSS-variable adapter; validate acceptable color inputs in definitions. |
| `packages/core/src/lib/utils.ts` → `packages/react/src/lib/utils.ts` | Accept | Standard class-name merge helper. |
| `packages/react/src/renderer.test.ts` | Follow up | Good override and text-escaping smoke tests; add browser/interactive coverage listed in LOW-02. |
| `packages/studio/src/index.css` → `packages/react/src/styles.css` | Move | Shared form styling correctly follows the renderer; dark tokens and global theme assumptions should be documented. |
| `packages/react/test-file-stub.cjs` | Accept | Minimal Jest asset stub. |
| `packages/react/tsconfig.json` | Accept | Strict declaration-only project correctly references core and leaves bundling to Vite. |
| `packages/react/vite.config.ts` | Accept | Produces a compact ESM library and externalizes runtime dependencies appropriately. |

### Removed Studio application

Every path below was checked for a surviving import, route, build reference, or
deployment reference. None remains. A few generic UI primitives were moved to
the React renderer and are reviewed in the preceding table.

| Path | Disposition | Review note |
| --- | --- | --- |
| `packages/studio/.env` | Remove | Studio/Firebase environment file removed. |
| `packages/studio/.firebaserc` | Remove | Studio Firebase project metadata removed. |
| `packages/studio/AGENTS.md` | Remove | Instructions scoped to the deleted Studio workspace removed with it. |
| `packages/studio/components.json` | Remove | Studio-local component generator configuration no longer has a consumer. |
| `packages/studio/eslint.config.js` | Remove | Studio-only lint configuration removed. |
| `packages/studio/firebase.json` | Remove | Studio Firebase hosting configuration removed. |
| `packages/studio/index.html` | Remove | Studio HTML entrypoint removed. |
| `packages/studio/package.json` | Remove | Workspace removal is reflected in root lock/build graph. |
| `packages/studio/public/android-chrome-192x192.png` | Remove | Studio-specific public icon removed. |
| `packages/studio/public/android-chrome-512x512.png` | Remove | Studio-specific public icon removed. |
| `packages/studio/public/apple-touch-icon.png` | Remove | Studio-specific public icon removed. |
| `packages/studio/public/favicon-16x16.png` | Remove | Studio-specific public icon removed. |
| `packages/studio/public/favicon-32x32.png` | Remove | Studio-specific public icon removed. |
| `packages/studio/public/favicon.ico` | Remove | Studio-specific favicon removed. |
| `packages/studio/public/vite.svg` | Remove | Unused Studio starter asset removed. |
| `packages/studio/src/App.tsx` | Remove | Studio router/application shell removed. |
| `packages/studio/src/components/app-layout.tsx` | Remove | Authenticated Studio navigation layout removed. |
| `packages/studio/src/components/form-builder/completion.tsx` | Remove | Visual completion editor removed; completion remains YAML/API data. |
| `packages/studio/src/components/form-builder/connections.tsx` | Remove | Visual integration editor removed; trusted connection semantics still need API hardening. |
| `packages/studio/src/components/form-builder/index.ts` | Remove | Form-builder barrel removed. |
| `packages/studio/src/components/form-builder/section-field.tsx` | Remove | Visual field editor removed; definitions are now YAML/API authored. |
| `packages/studio/src/components/form-builder/section.tsx` | Remove | Visual section editor removed. |
| `packages/studio/src/components/form-builder/submission.tsx` | Remove | Studio submission panel removed; protected API reads replace it. |
| `packages/studio/src/components/index.ts` | Remove | Studio component barrel removed. |
| `packages/studio/src/components/page-header.tsx` | Remove | Studio page chrome removed. |
| `packages/studio/src/components/page-shell.tsx` | Remove | Studio page chrome removed. |
| `packages/studio/src/components/ui/badge.tsx` | Remove | Primitive used only by Studio removed. |
| `packages/studio/src/components/ui/button.tsx` | Remove | Studio copy removed; renderer button lives in React package. |
| `packages/studio/src/components/ui/checkbox.tsx` | Remove | Studio copy removed; renderer checkbox lives in React package. |
| `packages/studio/src/components/ui/dialog.tsx` | Remove | Studio copy removed; retained renderer dialog is reviewed separately. |
| `packages/studio/src/components/ui/empty.tsx` | Remove | Studio-specific empty state removed. |
| `packages/studio/src/components/ui/field.tsx` | Remove | Studio copy removed; renderer field primitive lives in React package. |
| `packages/studio/src/components/ui/index.ts` | Remove | Studio UI barrel removed. |
| `packages/studio/src/components/ui/item.tsx` | Remove | Studio-only item primitive removed. |
| `packages/studio/src/components/ui/label.tsx` | Remove | Studio copy removed; renderer label lives in React package. |
| `packages/studio/src/components/ui/separator.tsx` | Remove | Studio copy removed; renderer separator lives in React package. |
| `packages/studio/src/components/ui/tabs.tsx` | Remove | Studio copy removed; retained renderer tabs are reviewed separately. |
| `packages/studio/src/hooks/index.ts` | Remove | Studio hooks barrel removed. |
| `packages/studio/src/hooks/useAuth.ts` | Remove | Studio authentication state hook removed. |
| `packages/studio/src/hooks/useForms.ts` | Remove | Studio form-management query hook removed. |
| `packages/studio/src/hooks/useIsMobile.ts` | Remove | Studio layout helper removed. |
| `packages/studio/src/lib/auth.ts` | Remove | Browser Studio auth/token storage removed. |
| `packages/studio/src/lib/default-form.ts` | Remove | UI-builder default document removed; canonical examples now belong in docs/templates. |
| `packages/studio/src/lib/utils.ts` | Remove | Studio-local utility copy removed. |
| `packages/studio/src/main.tsx` | Remove | Studio browser entrypoint removed. |
| `packages/studio/src/pages/callback.page.tsx` | Remove | OAuth callback page removed. |
| `packages/studio/src/pages/dashboard.page.tsx` | Remove | Studio dashboard removed. |
| `packages/studio/src/pages/demo.page.tsx` | Remove | Studio demo-auth page removed. |
| `packages/studio/src/pages/form.page.tsx` | Remove | Visual form editor page removed. |
| `packages/studio/src/pages/index.ts` | Remove | Studio page barrel removed. |
| `packages/studio/src/pages/login.page.tsx` | Remove | Studio login page removed. |
| `packages/studio/tsconfig.node.json` | Remove | Studio Vite compiler config removed. |
| `packages/studio/vite.config.ts` | Remove | Studio build configuration removed. |

### Hosted web application

| Path | Disposition | Review note |
| --- | --- | --- |
| `packages/core/components.json` → `packages/web/components.json` | Move | Component generator metadata correctly follows the remaining web host. |
| `packages/core/eslint.config.js` → `packages/web/eslint.config.js` | Accept | Web-only linting is correctly isolated and currently passes. |
| `packages/core/index.html` → `packages/web/index.html` | Follow up | Correct host entrypoint; external Google Fonts and fixed language/privacy defaults need operator control. |
| `packages/web/package.json` | Accept | Thin host dependencies clearly separate core, renderer, data fetching, analytics, and React. |
| `packages/core/public/android-chrome-192x192.png` → `packages/web/public/android-chrome-192x192.png` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/android-chrome-512x512.png` → `packages/web/public/android-chrome-512x512.png` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/apple-touch-icon.png` → `packages/web/public/apple-touch-icon.png` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/favicon-16x16.png` → `packages/web/public/favicon-16x16.png` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/favicon-32x32.png` → `packages/web/public/favicon-32x32.png` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/favicon.ico` → `packages/web/public/favicon.ico` | Move | Binary asset moved unchanged to the actual web host. |
| `packages/core/public/vite.svg` → `packages/web/public/vite.svg` | Follow up | Moved unchanged but empty/unused; remove it to keep the host assets intentional. |
| `packages/web/src/App.tsx` | Accept | Tiny explicit route parser supports form ID, public source, privacy, and not-found routes without a router dependency. |
| `packages/web/src/components/index.ts` | Accept | Re-exporting renderer components keeps host imports concise. |
| `packages/studio/src/lib/api.ts` → `packages/web/src/lib/api.ts` | Accept | Host API-base resolution is intentionally tiny; normalize trailing slash if custom values are supported. |
| `packages/core/src/main.tsx` → `packages/web/src/main.tsx` | Accept | Clean composition of query and renderer providers. |
| `packages/core/src/pages/base.page.tsx` → `packages/web/src/pages/base.page.tsx` | Follow up | Clear presentation shell and safe text rendering; branding/legal links are not operator configurable. |
| `packages/core/src/pages/index.ts` → `packages/web/src/pages/index.ts` | Accept | Page barrel matches the small route set. |
| `packages/core/src/pages/main.page.tsx` → `packages/web/src/pages/main.page.tsx` | Follow up | Host orchestration is readable, but resume, locale, date-only enforcement, public config, refetch, and effect semantics need changes. |
| `packages/core/src/pages/not-found.page.tsx` → `packages/web/src/pages/not-found.page.tsx` | Accept | Reuses the renderer's neutral hero state. |
| `packages/core/src/pages/privacy-policy.page.tsx` → `packages/web/src/pages/privacy-policy.page.tsx` | Follow up | Generic legal claims are not safe for arbitrary self-hosters; see MEDIUM-10. |
| `packages/studio/tsconfig.app.json` → `packages/web/tsconfig.app.json` | Accept | Strict no-emit web config and core/React source paths are appropriate. |
| `packages/studio/tsconfig.json` → `packages/web/tsconfig.json` | Accept | Correct project references for web and Vite config. |
| `packages/core/tsconfig.node.json` → `packages/web/tsconfig.node.json` | Move | Node-side Vite config compiler correctly follows the web host. |
| `packages/web/vite.config.ts` | Follow up | Source aliases make monorepo development simple; production chunk warning and package-vs-source test parity should be monitored. |

## Final assessment

The branch achieves the structural vision: Studio is gone, the core flow is
understandable, the reusable packages exist, and self-hosting has a credible
starting point. I would approve the architecture after the trust model is made
explicit and the critical/high findings are resolved with tests. I would not
approve the current implementation for public deployment because a repository
author or anonymous uploader can spend the operator's resources and cross
server/browser trust boundaries.
