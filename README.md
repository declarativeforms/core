# Declarative Forms

Declarative Forms is an open-source, self-hosted forms platform where YAML
defines the form and GitHub stores it. Deploy the renderer, point it at a
repository, and manage forms through commits and pull requests instead of a
database-backed form builder.

> **Project status:** Declarative Forms is early-stage software. The version 1
> YAML contract and core workflow are tested, but operators should evaluate
> security, backups, and response-retention requirements before production use.

```text
YAML in GitHub
  → retrieve and validate
  → compile the active section
  → render with React
  → validate and store responses
```

This operating model is intended for developers, platform teams, open-source
communities, and other teams that already use Git. There is no visual editor or
administrative dashboard. GitHub remains the authoring, review, and change
history interface.

## Five-minute workflow

Create a YAML file in a GitHub repository:

```yaml
version: 1
title: "Contact us"
description: "Tell us how we can help."

sections:
  - id: contact
    fields:
      - id: name
        type: short_text
        label: "Name"
        validators:
          - required

      - id: email
        type: email
        label: "Email address"
        validators:
          - required

      - id: message
        type: long_text
        label: "Message"
        validators:
          - required

    next: done
```

Deploy Declarative Forms:

```bash
./scripts/create-env.sh forms.example.com admin@example.com
docker compose --env-file .env --file docker/compose.yaml up -d --build
```

Then open:

```text
https://forms.example.com/<owner>/<repository>/<path>
```

For example, `forms/contact.yaml` in `acme/company-forms` is available at:

```text
https://forms.example.com/acme/company-forms/forms/contact
```

The URL remains source-addressed and stable. When `ref` is omitted, GitHub's
default branch is used. Pin a branch, tag, or commit with:

```text
https://forms.example.com/acme/company-forms/forms/contact?ref=release-v1
```

Use [templates/contact.yaml](templates/contact.yaml) as a larger working
example. Every YAML file and documentation example is checked against the
runtime schema in CI.

## Public and trusted repositories

Any public repository can be rendered by its source URL. Unconfigured public
sources are deliberately untrusted:

- the deployment never sends them `GITHUB_TOKEN`;
- email and webhook `connections` do not execute; and
- external measurement configuration is removed.

Allowlist repositories that the deployment operator trusts:

```dotenv
GITHUB_TRUSTED_REPOSITORIES=acme/company-forms,acme/internal-forms
```

Trusted repositories may execute configured connections. For private
repositories, also set a fine-grained GitHub token with read-only **Contents**
access to only the required repositories:

```dotenv
GITHUB_TOKEN=github_pat_replace_me
```

The token stays in the API container and is never returned to respondents.
Anyone who knows a private form's public Declarative Forms URL can render and
submit it, matching the behavior of a share link.

## What is supported

- Sections and multi-step navigation
- Conditional visibility, branching, completion messages, and redirects
- Localized labels and messages
- Required, pattern, length, range, selection-count, and safe-expression
  validation
- Text, email, number, date/time, select, rating, address, geolocation,
  signature, camera, hidden, and file-upload fields
- URL prefilling and resumable partial submissions
- MongoDB response storage and MinIO/S3-compatible uploads
- Trusted email and HTTPS webhook connections
- A small primary-color theme and optional Mixpanel measurement
- React component overrides through `@declarativeforms/react`

Unknown YAML properties are rejected so misspellings do not fail silently. See
the [YAML reference](docs/reference/yaml-schema.mdx) and
[field examples](docs/field-types/index.mdx).

Not currently included:

- visual form authoring;
- accounts, teams, or an administration dashboard;
- analytics dashboards or workflow automation;
- a database-backed form-definition API; or
- a general extension/plugin system.

## Self-hosting

The production Compose stack includes:

| Service | Purpose | Public |
| --- | --- | --- |
| Traefik | HTTPS and Let's Encrypt | ports 80/443 |
| Web | Respondent application and API proxy | through Traefik |
| API | GitHub retrieval, validation, submissions, integrations | through Traefik |
| MongoDB | Responses, resume state, and email verification | no |
| MinIO | Uploaded response files | no |
| Bucket initializer | Creates the restricted MinIO application account | no |

Required and optional configuration is documented in
[`.env.example`](.env.example). The most important values are:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DOMAIN` | yes | Public forms hostname |
| `LETSENCRYPT_EMAIL` | yes | Let's Encrypt account |
| `API_KEY` | yes | Protects submission reads |
| `AUTH_JWT_SECRET` | yes | Signs respondent capabilities |
| `GITHUB_TRUSTED_REPOSITORIES` | no | Repositories trusted to use server-side features |
| `GITHUB_TOKEN` | private repositories only | Read-only GitHub Contents access |
| MongoDB variables | yes | Response and verification persistence |
| MinIO variables | yes | Response-file persistence |
| Resend variables | email features only | Verification and email connections |

Verify a deployment:

```bash
docker compose --env-file .env --file docker/compose.yaml ps
docker compose --env-file .env --file docker/compose.yaml logs --follow api web traefik
curl https://forms.example.com/api/v1/health
curl https://forms.example.com/api/v1/ready
```

MongoDB responses and MinIO objects are retained until the operator removes
them. Back up the `mongodb_data`, `minio_data`, and `traefik_certs` volumes.
See the [self-hosting guide](docs/getting-started/self-host.mdx) for local
evaluation, upgrades, logs, and limitations.

## Response API

The respondent application saves partial and completed submissions through the
public API. Submission reads require `API_KEY`:

```bash
curl \
  -H "Authorization: Bearer $FORMS_API_KEY" \
  "$FORMS_HOST/api/v1/forms/<g-source-id>/submissions"
```

The form GET response contains the internal `g.…` source ID used by submission,
resume, email-verification, and upload endpoints. It encodes the GitHub source
reference and does not require a database mapping. The complete contract is in
[packages/api/openapi.yaml](packages/api/openapi.yaml).

## Architecture

`@declarativeforms/core` owns untrusted YAML parsing, strict definition
validation, compilation, navigation, and framework-independent response
validation. `@declarativeforms/react` maps a compiled active-section view
through an explicit component registry. The web application owns browser
routing and effects; the API owns GitHub access and response persistence.

See [docs/contributing/architecture.mdx](docs/contributing/architecture.mdx)
for the concrete execution path.

## Development

```bash
npm ci
npm test
npm run lint
npm run check:openapi
npm run build
```

For a local Docker stack without DNS or Let's Encrypt:

```bash
docker compose \
  --env-file .env.example \
  --file docker/compose.yaml \
  --file docker/compose.local.yaml \
  up -d --build mongodb minio create_bucket api web
```

Open `http://localhost:8080`; the API is also exposed at
`http://localhost:8081/api/v1`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing a field or the YAML
contract. Security reports should follow [SECURITY.md](SECURITY.md).

## Migration from database-managed definitions

The current Git-native model no longer serves legacy `f…` database-managed
forms or `a…` database-backed GitHub mappings. Before upgrading an older
deployment:

1. export each JSON definition through the old management API;
2. convert it to version 1 YAML and commit it to GitHub;
3. allowlist the repository when it needs trusted connections;
4. replace the old share link with the source-addressed URL; and
5. retain the old database until response-retention obligations are resolved.

Existing form-definition and source-mapping collections are not automatically
deleted. Historical submission-read endpoints can still access responses by
their stored form IDs.

## License

Apache License 2.0. See [LICENSE](LICENSE).
