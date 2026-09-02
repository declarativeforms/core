#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_NAME="${0##*/}"
readonly INSTALL_DIR="/opt/frms"
readonly REPOSITORY="declarativeforms/core"

IMAGE_TAG="latest"
ENVIRONMENT_FILE=""

usage() {
  cat <<EOF
Deploy Declarative Forms on an Ubuntu DigitalOcean Droplet.

Usage:
  sudo ./$SCRIPT_NAME [--env-file PATH] [--tag TAG]

Options:
  --env-file PATH   Environment file to install as $INSTALL_DIR/.env.
                    Required on a first run; afterwards the existing file is
                    reused. Copy .env.example and fill it in.
  --tag TAG         Published image tag to deploy, for example v1.2.0.
                    Default: $IMAGE_TAG
  -h, --help        Show this help.

Images are pulled from ghcr.io/$REPOSITORY-{web,studio,api}; nothing is compiled on the
Droplet. Re-run to move to a newer tag.

Once the stack is running, the web, studio, api and scheduler containers keep
themselves on the newest image published for the deployed tag; the updater checks
every UPDATE_INTERVAL seconds. Traefik, MongoDB and MinIO never update on their
own. Re-run this script only to change compose.yaml, .env, or the image tag.

Example:
  sudo ./$SCRIPT_NAME --env-file /root/.env
EOF
}

log() {
  printf '==> %s\n' "$*"
}

fatal() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_value() {
  [[ -n "${2-}" ]] || fatal "$1 requires a value"
}

compose() {
  docker compose \
    --project-directory "$INSTALL_DIR" \
    --env-file "$INSTALL_DIR/.env" "$@"
}

# Write KEY=VALUE into the installed env file, replacing any existing line.
# The updater reads that file on every pass, so it has to agree with what this
# script deployed. Passing IMAGE_TAG through the process environment instead
# would win over --env-file here but not there, and the updater would quietly
# move a pinned deployment back onto the tag recorded in .env.
set_env_var() {
  local key="$1" value="$2" file="$INSTALL_DIR/.env"

  if grep -q "^$key=" "$file"; then
    sed -i "s|^$key=.*|$key=$value|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi

  chmod 0600 "$file"
}

install_docker() {
  local codename

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Using existing $(docker --version)"
    return
  fi

  log "Installing Docker Engine and Compose"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  # shellcheck source=/dev/null
  source /etc/os-release
  codename="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
  [[ -n "$codename" ]] || fatal "cannot determine the Ubuntu codename"

  cat >/etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $codename
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

  apt-get update
  apt-get install -y containerd.io docker-buildx-plugin docker-ce docker-ce-cli \
    docker-compose-plugin
}

fetch_compose() {
  # `latest` tracks the default branch; a release tag has a matching Git tag.
  local ref="$IMAGE_TAG"
  [[ "$ref" == "latest" ]] && ref="main"

  log "Fetching compose.yaml at $ref"
  install -d -m 0755 "$INSTALL_DIR"
  curl -fsSL "https://raw.githubusercontent.com/$REPOSITORY/$ref/compose.yaml" \
    -o "$INSTALL_DIR/compose.yaml"
}

install_env() {
  if [[ -n "$ENVIRONMENT_FILE" ]]; then
    log "Installing $ENVIRONMENT_FILE as $INSTALL_DIR/.env"
    install -m 0600 "$ENVIRONMENT_FILE" "$INSTALL_DIR/.env"
  fi

  [[ -f "$INSTALL_DIR/.env" ]] ||
    fatal "no $INSTALL_DIR/.env. Copy .env.example, fill it in, and pass it with --env-file."
}

deploy() {
  log "Recording IMAGE_TAG=$IMAGE_TAG in $INSTALL_DIR/.env"
  set_env_var IMAGE_TAG "$IMAGE_TAG"

  log "Pulling images at tag $IMAGE_TAG"
  compose pull

  log "Starting the stack"
  compose up -d --wait --wait-timeout 300
}

while (($# > 0)); do
  case "$1" in
    --env-file) require_value "$@"; ENVIRONMENT_FILE="$2"; shift 2 ;;
    --tag) require_value "$@"; IMAGE_TAG="$2"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) fatal "unknown option: $1" ;;
  esac
done

[[ -z "$ENVIRONMENT_FILE" || -r "$ENVIRONMENT_FILE" ]] ||
  fatal "cannot read --env-file: $ENVIRONMENT_FILE"
[[ $EUID -eq 0 ]] || fatal "run this script as root (for example, with sudo)"

install_docker
fetch_compose
install_env
deploy

compose ps
log "Deployment complete. The stack serves the DOMAIN set in $INSTALL_DIR/.env"
