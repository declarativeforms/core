# DigitalOcean deployment

Declarative Forms is designed to run inexpensively on one Ubuntu Droplet. The
production Compose stack contains Traefik, the web app, the API, a connection
scheduler worker, MongoDB, and MinIO.

## Architecture

- Traefik exposes ports 80 and 443 and obtains a Let's Encrypt certificate with
  HTTP-01 validation.
- A persistent host firewall permits public HTTP/HTTPS and filters
  Docker-published ports through the `DOCKER-USER` chain. It does not add,
  remove, or alter SSH firewall rules.
- MongoDB and MinIO are available only on an internal Docker network. The API
  joins that network and a separate outbound network for GitHub form reads.
- The API uses browser-based GitHub OAuth for its hosted MCP endpoint. It
  issues encrypted, expiring MCP tokens and uses their enclosed GitHub
  credentials to write form YAML to public repositories the user can access.
  GitHub tokens are not stored in MongoDB or returned to callers.
- The scheduler joins MongoDB's internal network and the outbound network. It
  exposes no port and is the only process that delivers queued email and
  webhook connections.
- Submissions, uploads, and certificate state live in named Docker volumes on
  the Droplet's root disk.
- There is no load balancer, managed database, block volume, or managed object
  storage. This keeps the setup inexpensive, but the Droplet remains a single
  point of failure.

## Create the Droplet

Ubuntu 24.04 LTS with 1 shared vCPU, 2 GiB RAM, and 50 GiB disk is the practical
minimum for the full stack. The setup script adds 2 GiB of swap for build-time
headroom.

At the DigitalOcean account level:

1. Add an SSH key when creating the Droplet.
2. Enable monitoring and weekly or daily Droplet backups.
3. Point a DNS `A` record for the desired domain at the Droplet's public IPv4
   address. Keep it DNS-only for the initial deployment, or use
   `--skip-dns-check` if an intentional reverse proxy hides the origin address.

Backups and monitoring cannot be enabled from inside the VM and are therefore
not managed by the setup script. A DigitalOcean Cloud Firewall is optional
defence in depth; the script installs all required firewall rules on the host.
If a Cloud Firewall is attached, it must allow HTTP and HTTPS or it will take
precedence before packets reach the host. SSH policy remains operator-managed.

## Run the automated setup

Download the script from the public repository:

```sh
curl --fail --remote-name \
  https://raw.githubusercontent.com/declarativeforms/core/main/scripts/setup-digitalocean.sh
chmod +x setup-digitalocean.sh
```

Run it as root after DNS resolves to the VM:

```sh
sudo ./setup-digitalocean.sh \
  --domain forms.example.com \
  --email admin@example.com \
  --github-client-id Ov23example \
  --github-client-secret-file /root/secrets/github-client-secret \
  --smoke-form declarativeforms/core/contact
```

Before running the setup, set the GitHub OAuth App authorization callback URL
to `https://forms.example.com/oauth/callback`. The API requests the
`public_repo` scope during authorization. Store the OAuth App secret in the file
supplied to `--github-client-secret-file`; the script reads it without placing
the secret in the process list.

The script:

- supports Ubuntu 22.04, 24.04, and 26.04 LTS Droplets;
- installs Docker Engine, Buildx, and Compose from Docker's official APT
  repository on a fresh host;
- configures a 2 GiB swap file and bounded Docker logs;
- creates a non-root `deploy` account, copies the invoking operator's SSH keys,
  disables password and direct root SSH, and enables Fail2ban;
- installs persistent IPv4 and IPv6 rules for HTTP/HTTPS plus Docker-aware
  forwarding rules, without changing SSH firewall access;
- clones the requested public repository branch or tag into `/opt/frms`;
- generates URL-safe MongoDB, MinIO, and API-token encryption credentials
  without printing them;
- builds and starts the stack, then verifies its trusted certificate, web
  health, API health, and an optional GitHub-backed form.

View every parameter with:

```sh
./setup-digitalocean.sh --help
```

The generated `declarativeforms-firewall.service` reapplies the policy after
reboots and Docker restarts. Its `DOCKER-USER` rules prevent a future Compose
port publication from silently bypassing the HTTP/HTTPS-only Docker policy.
Host SSH traffic falls through to the VM's pre-existing firewall policy.

Optional API keys are accepted through files rather than command-line values,
so they do not appear in the process list. For example:

```sh
sudo ./setup-digitalocean.sh \
  --domain forms.example.com \
  --email admin@example.com \
  --resend-api-key-file /root/secrets/resend \
  --resend-from-email forms@example.com
```

## Idempotency and updates

Rerun the same command to fetch and deploy the latest commit at the selected
`--ref`. The script refuses to replace a dirty checkout or a checkout whose
origin differs from `--repo-url`.

An existing `/opt/frms/.env` is never regenerated. This preserves the
credentials associated with existing MongoDB and MinIO volumes. If the domain,
Let's Encrypt email, or an integration secret must change, edit `.env`
explicitly before rerunning the script.

Deployments created before hosted MCP authorization was added must set
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_TOKEN_SECRET` in
`/opt/frms/.env` before rerunning the setup script.

Production credentials are stored only in `/opt/frms/.env`, owned by the deploy
user with mode `0600`.

## Manual update

```sh
ssh deploy@YOUR_DROPLET_IP
cd /opt/frms
git status --short
git fetch --depth=1 origin main
git checkout --detach --force FETCH_HEAD
docker compose build --pull
docker compose pull --ignore-buildable
docker compose up -d --remove-orphans --wait --wait-timeout 300
```

## Verification and operations

```sh
curl --fail https://forms.example.com/healthz
curl --fail https://forms.example.com/api/v1/health
docker compose --project-directory /opt/frms ps
docker compose --project-directory /opt/frms logs --since=15m
```

The expected long-running services are Traefik, web, API, scheduler, MongoDB,
and MinIO.
The `create_bucket` service should exit successfully after ensuring the bucket
exists.

Connection deliveries are stored as jobs in MongoDB. If the scheduler is
restarted, pending jobs remain available. Inspect worker activity with:

```sh
docker compose --project-directory /opt/frms logs --since=15m scheduler
```

Run one scheduler replica. This intentionally simple queue provides
at-least-once delivery, so a process crash immediately after sending can cause
a retry.

Persistent volumes are named `declarativeforms_mongodb_data`,
`declarativeforms_minio_data`, and `declarativeforms_traefik_certs`. Restoring a
Droplet backup restores these volumes with the rest of the root disk.
