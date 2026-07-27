# Declarative Forms

Declarative Forms renders forms from a YAML definition stored in GitHub or from
a JSON definition managed through an API. It has no administrative UI: forms
can be managed by scripts, automation tools such as Zapier, or coding agents.

The project deliberately has a short, visible flow:

```text
YAML / JSON FormDefinition
          |
          v
  compiled FormView
          |
          v
React rendering engine
          |
          v
 answers and submissions
```

`@declarativeforms/core` owns parsing, compilation, validation, and the
framework-independent runtime. `@declarativeforms/react` renders a compiled
view with built-in or application-provided field components. The web
application hosts that renderer, while the API resolves form definitions,
stores submissions, and handles integrations.

## Self-hosting

You need:

- a Linux host with Docker Engine and Docker Compose v2;
- ports 80 and 443 open to the internet; and
- an A or AAAA DNS record for your forms hostname pointing to the host.

Clone the repository, create the environment file, and replace every placeholder:

```bash
cp .env.example .env
openssl rand -hex 32
docker compose --env-file .env --file docker/compose.yaml up -d --build
```

Traefik redirects HTTP to HTTPS and obtains a Let's Encrypt certificate after
DNS reaches the host. The stack exposes only ports 80 and 443. MongoDB and
MinIO stay on a private Docker network, and their data and the ACME
certificates are kept in named volumes.

Check the deployment with:

```bash
docker compose --env-file .env --file docker/compose.yaml ps
docker compose --env-file .env --file docker/compose.yaml logs --follow api web traefik
curl https://forms.example.com/api/v1/health
```

Replace `forms.example.com` with `DOMAIN`. Upgrade by pulling the new source
and rerunning the `up -d --build` command. Back up the `mongodb_data`,
`minio_data`, and `traefik_certs` volumes according to your host's normal
backup process.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DOMAIN` | yes | Public hostname used by Traefik, the renderer, and file URLs |
| `LETSENCRYPT_EMAIL` | yes | Let's Encrypt account and expiry email |
| `API_KEY` | yes | Bearer key for management and submission-read endpoints |
| `AUTH_JWT_SECRET` | yes | Signs respondent email-verification tokens |
| `GITHUB_TOKEN` | private repos only | Read-only fine-grained GitHub token held by the server |
| `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` | yes | Private MongoDB credentials; use URL-safe characters |
| `MONGODB_DATABASE_NAME` | no | Database name; defaults to `declarativeforms` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | yes | Private object-storage credentials |
| `MINIO_BUCKET` | no | Upload bucket; defaults to `declarativeforms` |
| `AWS_REGION` | no | S3 compatibility region; defaults to `us-east-1` |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | email features only | Sends verification and connection emails |

Keep `.env` outside version control. Changing database or object-storage
credentials after the first start also requires updating the corresponding
stored service credentials or recreating the volumes.

## Create and render a form

Management requests use the deployment API key:

```bash
export FORMS_HOST=https://forms.example.com
export FORMS_API_KEY=replace-with-your-api-key
```

Create an API-managed form by sending its JSON definition:

```bash
curl --fail-with-body \
  -X POST "$FORMS_HOST/api/v1/forms" \
  -H "Authorization: Bearer $FORMS_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "version": 1,
    "title": "Contact us",
    "sections": [{
      "id": "contact",
      "title": "Your details",
      "fields": [{
        "id": "email",
        "type": "email",
        "label": "Email",
        "validators": ["required"]
      }],
      "next": "done"
    }]
  }'
```

The response contains a server-generated `f...` ID. Open
`https://forms.example.com/<form-id>` to render it. IDs and timestamps are
server controlled.

List, replace, or delete API-managed forms:

```bash
curl -H "Authorization: Bearer $FORMS_API_KEY" \
  "$FORMS_HOST/api/v1/forms"

curl -X PUT \
  -H "Authorization: Bearer $FORMS_API_KEY" \
  -H "Content-Type: application/json" \
  --data @form.json \
  "$FORMS_HOST/api/v1/forms/f12345678"

curl -X DELETE \
  -H "Authorization: Bearer $FORMS_API_KEY" \
  "$FORMS_HOST/api/v1/forms/f12345678"
```

`PUT` replaces the whole definition. Keep the source definition in version
control and send the complete document on updates.

### GitHub YAML

Public GitHub repositories can be rendered without credentials using the
GitHub-backed URL supported by the web application. To give a private source
a stable, shareable form ID, first create a fine-grained token with read-only
Contents access to that repository and set it as `GITHUB_TOKEN` on the server.
Then register the source:

```bash
curl --fail-with-body \
  -X POST "$FORMS_HOST/api/v1/forms/github" \
  -H "Authorization: Bearer $FORMS_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "owner": "acme",
    "repository": "internal-forms",
    "path": "forms/contact.yaml",
    "ref": "main"
  }'
```

The returned `a...` ID can be opened at
`https://forms.example.com/<form-id>`. `ref` is optional and defaults to
`main`. The token never goes to the browser. Rotate it in `.env` and recreate
the API container if it is exposed:

```bash
docker compose --env-file .env --file docker/compose.yaml up -d --no-deps --force-recreate api
```

### Submissions

Respondents submit through the public form renderer. External clients can use
the same public endpoint:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"email":"person@example.com"}' \
  "$FORMS_HOST/api/v1/forms/f12345678/submissions"
```

Reading submission data is always protected:

```bash
curl -H "Authorization: Bearer $FORMS_API_KEY" \
  "$FORMS_HOST/api/v1/forms/f12345678/submissions"

curl -H "Authorization: Bearer $FORMS_API_KEY" \
  "$FORMS_HOST/api/v1/forms/f12345678/submissions/submission-id"
```

Use a restricted secret store when configuring Zapier, an agent, or another
automation client with `FORMS_API_KEY`.

## Use the packages

The headless package can parse YAML and compile only the active section:

```ts
import {
  compileFormView,
  createFormRuntime,
  parseFormYaml,
} from "@declarativeforms/core";

const definition = parseFormYaml(yamlSource);
const firstSectionId = definition.sections?.[0]?.id ?? "";
const view = compileFormView(definition, "en", {}, firstSectionId);
const runtime = createFormRuntime(definition, { locale: "en" });
```

The React renderer includes defaults for the built-in field types. Applications
can replace only the visual components they need:

```tsx
import type { FormDefinition } from "@declarativeforms/core";
import {
  FormRenderer,
  type FieldComponentProps,
  type FormRendererProps,
} from "@declarativeforms/react";
import "@declarativeforms/react/styles.css";

function CustomRating(props: FieldComponentProps) {
  return (
    <label>
      {props.field.label}
      <input
        type="range"
        min="1"
        max="5"
        value={Number(props.controllerField.value ?? 1)}
        onChange={(event) =>
          props.controllerField.onChange(Number(event.target.value))
        }
      />
    </label>
  );
}

export function MyForm({
  definition,
  onEffect,
}: {
  definition: FormDefinition;
  onEffect: FormRendererProps["onEffect"];
}) {
  return (
    <FormRenderer
      definition={definition}
      locale="en"
      initialData={{}}
      components={{ rating: CustomRating }}
      onEffect={onEffect}
    />
  );
}
```

The definition and runtime remain independent of React; component overrides
receive the compiled field view and its current value/change handler rather
than needing API or routing knowledge.

## Development

Install dependencies, run tests, and build all workspaces:

```bash
npm ci
npm test
npm run build
```

The main workspaces are:

- `@declarativeforms/core`: YAML-to-view compiler and form runtime;
- `@declarativeforms/react`: default React rendering and component registry;
- `@declarativeforms/web`: hosted respondent application; and
- `@declarativeforms/api`: form, submission, GitHub, upload, and connection API.

There is intentionally no Studio or administrative frontend. API behavior is
documented by the [OpenAPI contract](packages/api/openapi.yaml).

For a local Docker stack without DNS or Let's Encrypt, run:

```bash
docker compose \
  --env-file .env.example \
  --file docker/compose.yaml \
  --file docker/compose.local.yaml \
  up -d --build mongodb minio create_bucket api web
```

The renderer is then available at `http://localhost:8080`, with the API also
available directly at `http://localhost:8081/api/v1`.

## License

Apache License 2.0. See [LICENSE](LICENSE).
