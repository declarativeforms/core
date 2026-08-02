# Declarative Forms

Declarative Forms renders forms defined in YAML, accepts submissions through a
Fastify API, and stores submission data and uploaded files. The included Docker
Compose setup runs the complete core stack on one host:

- Traefik for HTTPS routing and automatic Let's Encrypt certificates;
- an Nginx-served React application;
- the Node.js API;
- MongoDB for application data; and
- MinIO for private S3-compatible object storage.

A server-side GitHub personal access token and Resend are optional external
integrations. They are not needed to start the core stack.

## Production self-hosting

The host needs Docker Engine with Docker Compose v2, inbound ports 80 and 443,
and an A or AAAA record for the deployment hostname.

Create the deployment configuration and replace every placeholder:

```bash
cp .env.example .env
openssl rand -hex 32
```

Put the generated value in `AUTH_JWT_SECRET`, choose strong MongoDB and MinIO
credentials, and set `DOMAIN` and `LETSENCRYPT_EMAIL`. MongoDB credentials must
be URL-safe because Compose places them in the connection URI.

Start the stack:

```bash
docker compose --env-file .env up --detach --build
```

Traefik redirects HTTP to HTTPS and requests a certificate after the DNS record
resolves to the host. Only ports 80 and 443 are published. The API, MongoDB, and
MinIO remain on a private Docker network.

Check the deployment with:

```bash
docker compose --env-file .env ps
docker compose --env-file .env logs --follow web api traefik
curl --fail https://forms.example.com/api/v1/health
```

Replace `forms.example.com` with the configured domain.

## Local Docker stack

The local override omits Traefik and serves the application over HTTP. It uses
the same API, database, and object-storage containers as production:

```bash
cp .env.example .env
docker compose \
  --env-file .env \
  --file compose.yaml \
  --file compose.local.yaml \
  up --detach --build
```

Open `http://localhost:8080`, or change `CORE_PORT` in `.env`. The API is
available through the same origin at `http://localhost:8080/api/v1`; backend
container ports are not published.

Stop the local stack without removing persistent data:

```bash
docker compose \
  --env-file .env \
  --file compose.yaml \
  --file compose.local.yaml \
  down
```

## Configuration

| Variable                | Required                  | Purpose                                               |
| ----------------------- | ------------------------- | ----------------------------------------------------- |
| `DOMAIN`                | production                | Public hostname matched by Traefik                    |
| `LETSENCRYPT_EMAIL`     | production                | Let's Encrypt account and expiry email                |
| `PUBLIC_BASE_URL`       | no                        | Override the public origin used in uploaded-file URLs |
| `AUTH_JWT_SECRET`       | yes                       | Signs email-verification tokens                       |
| `MONGO_ROOT_USERNAME`   | yes                       | MongoDB root username                                 |
| `MONGO_ROOT_PASSWORD`   | yes                       | URL-safe MongoDB root password                        |
| `MONGODB_DATABASE_NAME` | no                        | Database name; defaults to `declarativeforms`         |
| `MINIO_ROOT_USER`       | yes                       | Private MinIO access key                              |
| `MINIO_ROOT_PASSWORD`   | yes                       | Private MinIO secret key                              |
| `MINIO_BUCKET`          | no                        | Upload bucket; defaults to `declarativeforms`         |
| `AWS_REGION`            | no                        | S3 compatibility region; defaults to `us-east-1`      |
| `CORE_PORT`             | local only                | Local frontend port; defaults to `8080`               |
| `GITHUB_TOKEN`          | private repositories only | Server-side GitHub personal access token              |
| `RESEND_API_KEY`        | email features only       | Resend API key                                        |
| `RESEND_FROM_EMAIL`     | email features only       | Verified sender address                               |

Public GitHub repositories work without credentials. For private repositories,
create a fine-grained personal access token restricted to the repositories that
contain forms and grant it read-only Contents permission. Put it in
`GITHUB_TOKEN`; it is supplied only to the API at runtime and is never included
in browser URLs or stored form metadata. Forms remain publicly renderable by
URL, so repository selection and PAT scope are the security boundary. Recreate
the API container after rotating the token; the frontend does not need rebuilding.

Uploaded objects are not exposed directly from MinIO. The API retrieves them
through `/api/v1/files/*`, so generated file URLs use the same public hostname
and certificate as the form application.

## Operations

Upgrade after pulling new source with:

```bash
docker compose --env-file .env up --detach --build
```

Back up the `mongodb_data`, `minio_data`, and `traefik_certs` named volumes. The
first two contain application data; the third contains the Let's Encrypt ACME
account and certificates. Do not run `docker compose down --volumes` unless the
stored data and certificates should be deleted.

Changing MongoDB or MinIO credentials after their volumes have been initialized
also requires updating the credentials inside those services or recreating the
corresponding volume from a backup.

## Development

Install dependencies, build all workspaces, and run the API tests:

```bash
npm ci
npm run build
npm test
```
