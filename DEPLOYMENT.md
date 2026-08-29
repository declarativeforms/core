# DigitalOcean deployment

Declarative Forms is designed to run inexpensively on one Ubuntu Droplet. The
production Compose stack contains Traefik, the web app, the API, a connection
scheduler worker, MongoDB, and MinIO.

## Architecture

- Traefik exposes ports 80 and 443 and obtains a Let's Encrypt certificate with
  HTTP-01 validation.
- MongoDB and MinIO are available only on an internal Docker network. The API
  joins that network and a separate outbound network for GitHub form reads.
- The scheduler joins MongoDB's internal network and the outbound network. It
  exposes no port and is the only process that delivers queued email and
  webhook connections.
- Submissions, uploads, and certificate state live in named Docker volumes on
  the Droplet's root disk.
- There is no load balancer, managed database, block volume, or managed object
  storage. This keeps the setup inexpensive, but the Droplet remains a single
  point of failure.

## Create the Droplet

Ubuntu 24.04 LTS, 50 GiB disk, 4 GiB RAM. Size for the build rather than the
running stack: the `api` image compiles the monorepo inside the container, and
2 GiB is not enough without swap.

Then, at the account level:

1. Add an SSH key when creating the Droplet.
2. Enable monitoring and Droplet backups.
3. Attach a Cloud Firewall allowing SSH, HTTP, and HTTPS.
4. Point the DNS `A` record at the Droplet and let it resolve. Traefik uses the
   ACME HTTP-01 challenge, so Let's Encrypt cannot issue a certificate until it
   does.

## Run the automated setup

Fill in an environment file from [`.env.example`](./.env.example). `DOMAIN` and
`LETSENCRYPT_EMAIL` are required, and the MongoDB and MinIO passwords must be
URL-safe because Compose interpolates them into a connection URI;
`openssl rand -hex 32` produces a suitable value.

```sh
scp .env root@YOUR_DROPLET_IP:/root/.env
```

Then, on the Droplet as root:

```sh
curl --fail --remote-name \
  https://raw.githubusercontent.com/declarativeforms/core/main/scripts/setup-digitalocean.sh
chmod +x setup-digitalocean.sh
sudo ./setup-digitalocean.sh --env-file /root/.env
```

It installs Docker, clones the repository, installs the environment file as
`/opt/frms/.env` with mode `0600`, and starts the stack. `--help` lists the
remaining options.

## Updates

Rerun the script to deploy the latest commit at the selected `--ref`.
`--env-file` can be omitted; the installed `/opt/frms/.env` is reused.

Do not change the MongoDB or MinIO credentials in a working deployment. They are
fixed when those volumes are first initialised, so replacing them leaves the
stack unable to authenticate against its own data. To change any other setting,
edit `/opt/frms/.env` and rerun the script.

By hand:

```sh
cd /opt/frms
git fetch --depth=1 origin main
git checkout --detach --force FETCH_HEAD
docker compose build --pull
docker compose pull --ignore-buildable
docker compose up -d --wait --wait-timeout 300
```

## Verification and operations

```sh
curl --fail https://forms.example.com/healthz
curl --fail https://forms.example.com/api/v1/health
docker compose --project-directory /opt/frms ps
docker compose --project-directory /opt/frms logs --since=15m
```

The expected long-running services are Traefik, web, API, scheduler, MongoDB,
and MinIO. The `create_bucket` service exits successfully once the bucket
exists.

Connection deliveries are queued as jobs in MongoDB and survive a scheduler
restart. Run one replica: the queue is deliberately simple and at-least-once, so
a crash immediately after sending can cause a retry.

```sh
docker compose --project-directory /opt/frms logs --since=15m scheduler
```

Persistent volumes are named `declarativeforms_mongodb_data`,
`declarativeforms_minio_data`, and `declarativeforms_traefik_certs`. Restoring a
Droplet backup restores these volumes with the rest of the root disk.
