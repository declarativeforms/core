#!/usr/bin/env bash
#
# Deploy Declarative Forms on an Ubuntu DigitalOcean Droplet.
#
# Installs Docker if it is missing, fetches compose.yaml, and starts the stack
# from the images published to GHCR. Nothing is built on the Droplet.
#
# Bring your own .env: see .env.example for the variables the stack needs.

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

Images are pulled from ghcr.io/$REPOSITORY-{web,api}; nothing is compiled on the
Droplet. Re-run to move to a newer tag.

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
  IMAGE_TAG="$IMAGE_TAG" docker compose \
    --project-directory "$INSTALL_DIR" \
    --env-file "$INSTALL_DIR/.env" "$@"
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
