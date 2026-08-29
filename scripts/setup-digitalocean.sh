#!/usr/bin/env bash
#
# Deploy Declarative Forms on an Ubuntu DigitalOcean Droplet.
#
# Installs Docker if it is missing, fetches the repository, and brings the
# Compose stack up. Bring your own .env: see .env.example for the variables the
# stack needs.

set -Eeuo pipefail

readonly SCRIPT_NAME="${0##*/}"
readonly INSTALL_DIR="/opt/frms"

REPOSITORY_URL="https://github.com/declarativeforms/core.git"
REPOSITORY_REF="main"
ENVIRONMENT_FILE=""

usage() {
  cat <<EOF
Deploy Declarative Forms on an Ubuntu DigitalOcean Droplet.

Usage:
  sudo ./$SCRIPT_NAME [--env-file PATH] [options]

Options:
  --env-file PATH   Environment file to install as $INSTALL_DIR/.env.
                    Required on a first run; afterwards the existing file is
                    reused. Copy .env.example and fill it in.
  --repo-url URL    Default: $REPOSITORY_URL
  --ref REF         Branch, tag, or commit to deploy. Default: $REPOSITORY_REF
  -h, --help        Show this help.

Re-run to deploy a newer revision. The installed .env is left alone, so the
credentials tied to the existing database and storage volumes are preserved.

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
  docker compose --project-directory "$INSTALL_DIR" \
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
  apt-get install -y ca-certificates curl git

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

sync_repository() {
  if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    log "Cloning $REPOSITORY_URL into $INSTALL_DIR"
    git clone --depth=1 "$REPOSITORY_URL" "$INSTALL_DIR"
  fi

  # Fetching the ref and checking out FETCH_HEAD works the same for a branch,
  # a tag, or a commit SHA.
  log "Checking out $REPOSITORY_REF"
  git -C "$INSTALL_DIR" fetch --depth=1 --force origin "$REPOSITORY_REF"
  git -C "$INSTALL_DIR" checkout --detach --force FETCH_HEAD
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
  log "Building images (this compiles the monorepo and takes a few minutes)"
  compose build --pull

  log "Pulling pinned service images"
  compose pull --ignore-buildable

  log "Starting the stack"
  compose up -d --wait --wait-timeout 300
}

while (($# > 0)); do
  case "$1" in
    --env-file) require_value "$@"; ENVIRONMENT_FILE="$2"; shift 2 ;;
    --repo-url) require_value "$@"; REPOSITORY_URL="$2"; shift 2 ;;
    --ref) require_value "$@"; REPOSITORY_REF="$2"; shift 2 ;;
    -h | --help) usage; exit 0 ;;
    *) fatal "unknown option: $1" ;;
  esac
done

[[ -z "$ENVIRONMENT_FILE" || -r "$ENVIRONMENT_FILE" ]] ||
  fatal "cannot read --env-file: $ENVIRONMENT_FILE"
[[ $EUID -eq 0 ]] || fatal "run this script as root (for example, with sudo)"

install_docker
sync_repository
install_env
deploy

compose ps
log "Deployment complete. The stack serves the DOMAIN set in $INSTALL_DIR/.env"
