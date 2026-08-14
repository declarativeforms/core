#!/usr/bin/env bash

set -Eeuo pipefail
umask 027

readonly SCRIPT_NAME="${0##*/}"
readonly DEFAULT_REPOSITORY_URL="https://github.com/declarativeforms/core.git"
readonly DEFAULT_INSTALL_DIR="/opt/frms"
readonly DEFAULT_DEPLOY_USER="deploy"
readonly DEFAULT_REF="main"
readonly DEFAULT_SWAP_SIZE_GB="2"
readonly DEFAULT_WAIT_TIMEOUT="300"

DOMAIN=""
LETSENCRYPT_EMAIL=""
REPOSITORY_URL="$DEFAULT_REPOSITORY_URL"
REPOSITORY_REF="$DEFAULT_REF"
INSTALL_DIR="$DEFAULT_INSTALL_DIR"
DEPLOY_USER="$DEFAULT_DEPLOY_USER"
SWAP_SIZE_GB="$DEFAULT_SWAP_SIZE_GB"
WAIT_TIMEOUT="$DEFAULT_WAIT_TIMEOUT"
DEPLOY_GROUP="$DEFAULT_DEPLOY_USER"
PUBLIC_INTERFACE=""
MONGO_ROOT_USERNAME="declarativeforms"
MONGODB_DATABASE_NAME="declarativeforms"
MINIO_ROOT_USER="declarativeforms"
MINIO_BUCKET="declarativeforms"
AWS_REGION="us-east-1"
GITHUB_TOKEN_FILE=""
GOOGLE_MAPS_API_KEY_FILE=""
RESEND_API_KEY_FILE=""
RESEND_FROM_EMAIL=""
SMOKE_FORM=""
SKIP_DNS_CHECK=false
HARDEN_SSH=true
TEMP_ENV_FILE=""
APT_GET=(apt-get -o DPkg::Lock::Timeout=300)

usage() {
  cat <<EOF
Provision Declarative Forms on a fresh Ubuntu DigitalOcean Droplet.

Usage:
  sudo ./$SCRIPT_NAME --domain DOMAIN --email EMAIL [options]

Required:
  --domain DOMAIN                 Public hostname already pointing at this VM.
  --email EMAIL                   Email used for Let's Encrypt notices.

Source and host options:
  --repo-url URL                  Public HTTPS Git repository.
                                   Default: $DEFAULT_REPOSITORY_URL
  --ref REF                       Git branch or tag to deploy. Default: $DEFAULT_REF
  --install-dir PATH              Absolute application path. Default: $DEFAULT_INSTALL_DIR
  --deploy-user USER              Non-root operator account. Default: $DEFAULT_DEPLOY_USER
  --swap-size-gb N                Swap file size; 0 disables it. Default: $DEFAULT_SWAP_SIZE_GB
  --wait-timeout SECONDS          Compose/TLS readiness timeout. Default: $DEFAULT_WAIT_TIMEOUT
  --skip-dns-check                Do not require DOMAIN to resolve directly to this VM.
  --no-ssh-hardening              Leave the existing SSH daemon configuration unchanged.

Application options:
  --mongo-user USER               Default: declarativeforms
  --mongo-database NAME           Default: declarativeforms
  --minio-user USER               Default: declarativeforms
  --minio-bucket NAME             Default: declarativeforms
  --aws-region REGION             Default: us-east-1
  --github-token-file PATH        File containing a GitHub token for private forms.
  --google-maps-key-file PATH     File containing a restricted Google Maps API key.
  --resend-api-key-file PATH      File containing a Resend API key.
  --resend-from-email EMAIL       Sender address used by email connections.
  --smoke-form OWNER/REPO/PATH    Also verify this public form through the live API.
  -h, --help                      Show this help.

The script is idempotent for installations it created. Existing .env files,
database volumes, object-storage volumes, and certificate state are preserved.

Example:
  sudo ./$SCRIPT_NAME --domain forms.example.com --email admin@example.com \\
    --smoke-form declarativeforms/core/contact
EOF
}

log() {
  printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

warn() {
  printf '[%s] WARNING: %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

fatal() {
  printf '[%s] ERROR: %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
  exit 1
}

on_error() {
  local exit_code=$?
  printf '[%s] ERROR: setup failed near line %s (exit %s)\n' \
    "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "${BASH_LINENO[0]}" "$exit_code" >&2
  exit "$exit_code"
}
trap on_error ERR

cleanup() {
  if [[ -n "$TEMP_ENV_FILE" && -f "$TEMP_ENV_FILE" ]]; then
    rm -f -- "$TEMP_ENV_FILE"
  fi
}
trap cleanup EXIT

require_value() {
  local option="$1"
  local value="${2-}"

  [[ -n "$value" && "$value" != --* ]] || fatal "$option requires a value"
}

while (($# > 0)); do
  case "$1" in
    --domain)
      require_value "$1" "${2-}"
      DOMAIN="$2"
      shift 2
      ;;
    --email)
      require_value "$1" "${2-}"
      LETSENCRYPT_EMAIL="$2"
      shift 2
      ;;
    --repo-url)
      require_value "$1" "${2-}"
      REPOSITORY_URL="$2"
      shift 2
      ;;
    --ref)
      require_value "$1" "${2-}"
      REPOSITORY_REF="$2"
      shift 2
      ;;
    --install-dir)
      require_value "$1" "${2-}"
      INSTALL_DIR="${2%/}"
      shift 2
      ;;
    --deploy-user)
      require_value "$1" "${2-}"
      DEPLOY_USER="$2"
      shift 2
      ;;
    --swap-size-gb)
      require_value "$1" "${2-}"
      SWAP_SIZE_GB="$2"
      shift 2
      ;;
    --wait-timeout)
      require_value "$1" "${2-}"
      WAIT_TIMEOUT="$2"
      shift 2
      ;;
    --mongo-user)
      require_value "$1" "${2-}"
      MONGO_ROOT_USERNAME="$2"
      shift 2
      ;;
    --mongo-database)
      require_value "$1" "${2-}"
      MONGODB_DATABASE_NAME="$2"
      shift 2
      ;;
    --minio-user)
      require_value "$1" "${2-}"
      MINIO_ROOT_USER="$2"
      shift 2
      ;;
    --minio-bucket)
      require_value "$1" "${2-}"
      MINIO_BUCKET="$2"
      shift 2
      ;;
    --aws-region)
      require_value "$1" "${2-}"
      AWS_REGION="$2"
      shift 2
      ;;
    --github-token-file)
      require_value "$1" "${2-}"
      GITHUB_TOKEN_FILE="$2"
      shift 2
      ;;
    --google-maps-key-file)
      require_value "$1" "${2-}"
      GOOGLE_MAPS_API_KEY_FILE="$2"
      shift 2
      ;;
    --resend-api-key-file)
      require_value "$1" "${2-}"
      RESEND_API_KEY_FILE="$2"
      shift 2
      ;;
    --resend-from-email)
      require_value "$1" "${2-}"
      RESEND_FROM_EMAIL="$2"
      shift 2
      ;;
    --smoke-form)
      require_value "$1" "${2-}"
      SMOKE_FORM="$2"
      shift 2
      ;;
    --skip-dns-check)
      SKIP_DNS_CHECK=true
      shift
      ;;
    --no-ssh-hardening)
      HARDEN_SSH=false
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fatal "unknown option: $1"
      ;;
  esac
done

validate_domain() {
  local domain="$1"
  local label
  local -a labels

  [[ ${#domain} -le 253 ]] || fatal "domain is longer than 253 characters"
  [[ "$domain" == *.* && "$domain" != *..* ]] || fatal "invalid domain: $domain"
  [[ "$domain" =~ ^[a-z0-9.-]+$ ]] || fatal "domain must contain only lowercase DNS characters"

  IFS='.' read -r -a labels <<<"$domain"
  for label in "${labels[@]}"; do
    [[ "$label" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || \
      fatal "invalid DNS label in domain: $label"
  done
}

validate_email() {
  local email="$1"
  [[ "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || \
    fatal "invalid email address: $email"
}

validate_identifier() {
  local label="$1"
  local value="$2"
  [[ "$value" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || \
    fatal "$label contains unsupported characters: $value"
}

[[ -n "$DOMAIN" ]] || fatal "--domain is required"
[[ -n "$LETSENCRYPT_EMAIL" ]] || fatal "--email is required"
DOMAIN="$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]')"
validate_domain "$DOMAIN"
validate_email "$LETSENCRYPT_EMAIL"
validate_identifier "MongoDB user" "$MONGO_ROOT_USERNAME"
validate_identifier "MongoDB database" "$MONGODB_DATABASE_NAME"
validate_identifier "MinIO user" "$MINIO_ROOT_USER"
validate_identifier "MinIO bucket" "$MINIO_BUCKET"
validate_identifier "AWS region" "$AWS_REGION"
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]{0,31}$ && "$DEPLOY_USER" != "root" ]] || \
  fatal "--deploy-user must be a non-root Linux username"

[[ "$REPOSITORY_URL" =~ ^https://[A-Za-z0-9.-]+/[A-Za-z0-9._~/-]+$ ]] || \
  fatal "--repo-url must be a public HTTPS URL"
[[ "$REPOSITORY_REF" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || \
  fatal "--ref contains unsupported characters"
[[ "$REPOSITORY_REF" != *..* && "$REPOSITORY_REF" != *//* ]] || \
  fatal "--ref contains an unsafe path sequence"
[[ "$INSTALL_DIR" == /* && "$INSTALL_DIR" != "/" ]] || \
  fatal "--install-dir must be an absolute, non-root path"
[[ ! "$INSTALL_DIR" =~ [[:space:]] && "$INSTALL_DIR" != *"/../"* && \
  "$INSTALL_DIR" != */.. && "$INSTALL_DIR" != *"//"* ]] || \
  fatal "--install-dir contains an unsafe path sequence"
[[ "$SWAP_SIZE_GB" =~ ^[0-9]+$ && "$SWAP_SIZE_GB" -le 16 ]] || \
  fatal "--swap-size-gb must be an integer from 0 to 16"
[[ "$WAIT_TIMEOUT" =~ ^[0-9]+$ && "$WAIT_TIMEOUT" -ge 60 && "$WAIT_TIMEOUT" -le 1800 ]] || \
  fatal "--wait-timeout must be between 60 and 1800 seconds"

if [[ -n "$RESEND_FROM_EMAIL" ]]; then
  validate_email "$RESEND_FROM_EMAIL"
fi
if [[ -n "$SMOKE_FORM" ]]; then
  [[ "$SMOKE_FORM" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+$ ]] || \
    fatal "--smoke-form must look like OWNER/REPO/PATH"
  [[ "$SMOKE_FORM" != *..* && "$SMOKE_FORM" != *//* ]] || \
    fatal "--smoke-form contains an unsafe path sequence"
fi

for secret_file in "$GITHUB_TOKEN_FILE" "$GOOGLE_MAPS_API_KEY_FILE" "$RESEND_API_KEY_FILE"; do
  [[ -z "$secret_file" || -r "$secret_file" ]] || fatal "cannot read secret file: $secret_file"
done

[[ $EUID -eq 0 ]] || fatal "run this script as root (for example, with sudo)"
[[ -r /etc/os-release ]] || fatal "cannot identify the operating system"

# shellcheck source=/dev/null
source /etc/os-release
[[ "${ID:-}" == "ubuntu" ]] || fatal "this script supports Ubuntu Droplets only"
case "${VERSION_ID:-}" in
  22.04 | 24.04 | 26.04) ;;
  *) fatal "unsupported Ubuntu release: ${VERSION_ID:-unknown}" ;;
esac

exec 9>/var/lock/declarativeforms-setup.lock
flock -n 9 || fatal "another $SCRIPT_NAME process is already running"

export DEBIAN_FRONTEND=noninteractive

install_base_packages() {
  log "Installing base packages"
  "${APT_GET[@]}" update
  "${APT_GET[@]}" install -y \
    ca-certificates \
    curl \
    fail2ban \
    git \
    jq \
    iproute2 \
    iptables \
    openssl \
    openssh-server \
    procps \
    sudo \
    unattended-upgrades \
    util-linux
}

install_docker() {
  local architecture
  local docker_codename
  local -a conflicts=()
  local package

  if command -v docker >/dev/null 2>&1; then
    docker compose version >/dev/null 2>&1 || \
      fatal "Docker exists but the Compose plugin is missing; install docker-compose-plugin first"
    log "Using existing $(docker --version)"
    return
  fi

  for package in docker.io docker-compose docker-compose-v2 docker-doc docker-buildx \
    podman-docker containerd runc; do
    if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed'; then
      conflicts+=("$package")
    fi
  done
  ((${#conflicts[@]} == 0)) || \
    fatal "conflicting container packages are installed: ${conflicts[*]}"

  log "Installing Docker Engine and Compose from Docker's official repository"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  architecture="$(dpkg --print-architecture)"
  docker_codename="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
  [[ -n "$docker_codename" ]] || fatal "cannot determine the Ubuntu codename"

  cat >/etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $docker_codename
Components: stable
Architectures: $architecture
Signed-By: /etc/apt/keyrings/docker.asc
EOF

  "${APT_GET[@]}" update
  "${APT_GET[@]}" install -y \
    containerd.io \
    docker-buildx-plugin \
    docker-ce \
    docker-ce-cli \
    docker-compose-plugin
}

configure_docker() {
  local current_config='{}'
  local firewall_backend
  local new_config
  local restart_required=false

  install -d -m 0755 /etc/docker
  if [[ -e /etc/docker/daemon.json ]]; then
    jq -e . /etc/docker/daemon.json >/dev/null || \
      fatal "/etc/docker/daemon.json is not valid JSON"
    current_config="$(</etc/docker/daemon.json)"
  fi

  firewall_backend="$(jq -r '.["firewall-backend"] // "iptables"' <<<"$current_config")"
  [[ "$firewall_backend" == "iptables" ]] || \
    fatal "Docker must use its iptables firewall backend, not: $firewall_backend"

  new_config="$(
    jq -c \
      '.["log-driver"] = "local" |
       .["log-opts"] = ((.["log-opts"] // {}) + {"max-size":"10m","max-file":"3"})' \
      <<<"$current_config"
  )"

  if [[ ! -e /etc/docker/daemon.json ]] || \
    ! cmp -s <(printf '%s\n' "$new_config") /etc/docker/daemon.json; then
    printf '%s\n' "$new_config" >/etc/docker/daemon.json
    chmod 0644 /etc/docker/daemon.json
    restart_required=true
  fi

  systemctl enable docker >/dev/null
  if [[ "$restart_required" == true ]]; then
    log "Applying bounded Docker log retention"
    systemctl restart docker
  else
    systemctl start docker
  fi

  docker info >/dev/null
  docker compose version
}

configure_swap() {
  local swap_path="/swapfile"

  ((SWAP_SIZE_GB > 0)) || return
  if swapon --noheadings --show=NAME | grep -Fxq "$swap_path"; then
    log "Existing swap file is active"
    return
  fi
  [[ ! -e "$swap_path" ]] || fatal "$swap_path exists but is not active swap"

  log "Creating ${SWAP_SIZE_GB} GiB swap file"
  if ! fallocate -l "${SWAP_SIZE_GB}G" "$swap_path"; then
    dd if=/dev/zero of="$swap_path" bs=1M count="$((SWAP_SIZE_GB * 1024))" status=progress
  fi
  chmod 0600 "$swap_path"
  mkswap "$swap_path" >/dev/null
  swapon "$swap_path"
  grep -Eq '^/swapfile[[:space:]]' /etc/fstab || \
    printf '/swapfile none swap sw 0 0\n' >>/etc/fstab
  printf 'vm.swappiness=10\n' >/etc/sysctl.d/60-declarativeforms-swap.conf
  sysctl --load=/etc/sysctl.d/60-declarativeforms-swap.conf >/dev/null
}

copy_operator_key() {
  local source_user="${SUDO_USER:-root}"
  local source_home
  local source_keys
  local target_home
  local target_keys

  target_home="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
  target_keys="$target_home/.ssh/authorized_keys"
  if [[ -s "$target_keys" ]]; then
    [[ -f "$target_keys" && ! -L "$target_keys" ]] || \
      fatal "$target_keys must be a regular file"
    return
  fi

  source_home="$(getent passwd "$source_user" | cut -d: -f6)"
  source_keys="$source_home/.ssh/authorized_keys"
  [[ -s "$source_keys" ]] || \
    fatal "no SSH authorized_keys found for $source_user; refusing to harden SSH"

  install -d -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" -m 0700 "$target_home/.ssh"
  install -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" -m 0600 "$source_keys" "$target_keys"
}

configure_operator() {
  local effective_sshd_config

  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    log "Creating non-root operator account: $DEPLOY_USER"
    useradd --create-home --user-group --shell /bin/bash "$DEPLOY_USER"
  fi

  DEPLOY_GROUP="$(id -gn "$DEPLOY_USER")"
  usermod -aG sudo,docker "$DEPLOY_USER"
  printf '%s ALL=(ALL) NOPASSWD:ALL\n' "$DEPLOY_USER" \
    >"/etc/sudoers.d/90-${DEPLOY_USER}"
  chmod 0440 "/etc/sudoers.d/90-${DEPLOY_USER}"
  visudo -cf "/etc/sudoers.d/90-${DEPLOY_USER}" >/dev/null

  copy_operator_key
  if [[ "$HARDEN_SSH" == true ]]; then
    # Ubuntu's socket-activated SSH service normally creates this ephemeral
    # directory. Package upgrades can briefly remove it before our standalone
    # configuration check runs.
    install -d -o root -g root -m 0755 /run/sshd
    cat >/etc/ssh/sshd_config.d/00-declarativeforms-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
X11Forwarding no
EOF
    chmod 0644 /etc/ssh/sshd_config.d/00-declarativeforms-hardening.conf
    sshd -t
    effective_sshd_config="$(sshd -T)"
    grep -Fxq 'passwordauthentication no' <<<"$effective_sshd_config" || \
      fatal "effective SSH configuration still permits password authentication"
    grep -Fxq 'kbdinteractiveauthentication no' <<<"$effective_sshd_config" || \
      fatal "effective SSH configuration still permits keyboard-interactive authentication"
    grep -Fxq 'permitrootlogin no' <<<"$effective_sshd_config" || \
      fatal "effective SSH configuration still permits direct root login"
    systemctl reload ssh
  fi

  cat >/etc/fail2ban/jail.d/declarativeforms-sshd.local <<'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
EOF
  systemctl enable --now fail2ban unattended-upgrades >/dev/null
}

write_firewall_config() {
  install -d -m 0700 /etc/declarativeforms
  printf 'PUBLIC_INTERFACE=%q\n' "$PUBLIC_INTERFACE" \
    >/etc/declarativeforms/firewall.conf
  chmod 0600 /etc/declarativeforms/firewall.conf
}

install_firewall_helper() {
  cat >/usr/local/sbin/declarativeforms-firewall <<'FIREWALL'
#!/usr/bin/env bash

set -Eeuo pipefail

readonly CONFIG_FILE="${DECLARATIVEFORMS_FIREWALL_CONFIG:-/etc/declarativeforms/firewall.conf}"
[[ -r "$CONFIG_FILE" ]] || {
  printf 'Missing firewall configuration: %s\n' "$CONFIG_FILE" >&2
  exit 1
}

# shellcheck source=/dev/null
source "$CONFIG_FILE"

chain_exists() {
  local tool="$1"
  local chain="$2"
  "$tool" -w -nL "$chain" >/dev/null 2>&1
}

create_or_flush_chain() {
  local tool="$1"
  local chain="$2"

  if chain_exists "$tool" "$chain"; then
    "$tool" -w -F "$chain"
  else
    "$tool" -w -N "$chain"
  fi
}

put_jump_first() {
  local tool="$1"
  local parent="$2"
  local child="$3"

  while "$tool" -w -C "$parent" -j "$child" >/dev/null 2>&1; do
    "$tool" -w -D "$parent" -j "$child"
  done
  "$tool" -w -I "$parent" 1 -j "$child"
}

configure_input_chain() {
  local tool="$1"

  create_or_flush_chain "$tool" DF_INPUT
  "$tool" -w -A DF_INPUT -i "$PUBLIC_INTERFACE" -p tcp \
    -m multiport --dports 80,443 -m conntrack --ctstate NEW -j ACCEPT
  "$tool" -w -A DF_INPUT -j RETURN
  put_jump_first "$tool" INPUT DF_INPUT
}

configure_docker_chain() {
  local tool="$1"
  local required="$2"

  if ! chain_exists "$tool" DOCKER-USER; then
    if [[ "$required" == true ]]; then
      printf '%s does not contain Docker\x27s DOCKER-USER chain\n' "$tool" >&2
      exit 1
    fi
    return
  fi

  create_or_flush_chain "$tool" DF_DOCKER
  "$tool" -w -A DF_DOCKER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
  "$tool" -w -A DF_DOCKER -i "$PUBLIC_INTERFACE" -p tcp \
    -m conntrack --ctstate NEW --ctorigdstport 80 -j ACCEPT
  "$tool" -w -A DF_DOCKER -i "$PUBLIC_INTERFACE" -p tcp \
    -m conntrack --ctstate NEW --ctorigdstport 443 -j ACCEPT
  "$tool" -w -A DF_DOCKER -i "$PUBLIC_INTERFACE" -j DROP
  "$tool" -w -A DF_DOCKER -j RETURN
  put_jump_first "$tool" DOCKER-USER DF_DOCKER
}

configure_input_chain iptables
configure_docker_chain iptables true

if command -v ip6tables >/dev/null 2>&1 && \
  ip6tables -w -nL INPUT >/dev/null 2>&1; then
  configure_input_chain ip6tables
  configure_docker_chain ip6tables false
fi

logger --tag declarativeforms-firewall \
  "Applied host and Docker firewall policy on $PUBLIC_INTERFACE"
FIREWALL
  chmod 0755 /usr/local/sbin/declarativeforms-firewall

  cat >/etc/systemd/system/declarativeforms-firewall.service <<'EOF'
[Unit]
Description=Declarative Forms host and Docker firewall
Wants=network-online.target
Requires=docker.service
After=network-online.target docker.service
PartOf=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/declarativeforms-firewall
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
  chmod 0644 /etc/systemd/system/declarativeforms-firewall.service
}

configure_firewall() {
  PUBLIC_INTERFACE="$(ip -4 route show default | awk '$1 == "default" {print $5; exit}')"
  [[ "$PUBLIC_INTERFACE" =~ ^[A-Za-z0-9_.:-]{1,15}$ ]] || \
    fatal "cannot determine a safe public network interface from the default route"

  log "Installing persistent host and Docker firewall rules"
  write_firewall_config
  install_firewall_helper
  systemctl daemon-reload
  systemctl enable declarativeforms-firewall.service >/dev/null
  systemctl restart declarativeforms-firewall.service
  systemctl is-active --quiet declarativeforms-firewall.service || \
    fatal "the firewall service did not become active"

  iptables -w -C INPUT -j DF_INPUT
  iptables -w -C DOCKER-USER -j DF_DOCKER
  log "Firewall active for public TCP ports 80 and 443; host SSH rules were not changed"
}

run_as_deploy() {
  runuser -u "$DEPLOY_USER" -- env GIT_TERMINAL_PROMPT=0 "$@"
}

sync_repository() {
  local actual_origin
  local parent_dir

  parent_dir="$(dirname "$INSTALL_DIR")"
  if [[ ! -d "$parent_dir" ]]; then
    install -d -m 0755 "$parent_dir"
  fi

  if [[ ! -e "$INSTALL_DIR" ]]; then
    install -d -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" -m 0755 "$INSTALL_DIR"
  fi
  if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    [[ -z "$(find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]] || \
      fatal "$INSTALL_DIR exists and is not an empty Git checkout target"
    log "Cloning $REPOSITORY_URL at $REPOSITORY_REF"
    run_as_deploy git clone --depth=1 --branch "$REPOSITORY_REF" \
      "$REPOSITORY_URL" "$INSTALL_DIR"
  fi

  actual_origin="$(run_as_deploy git -C "$INSTALL_DIR" remote get-url origin)"
  [[ "$actual_origin" == "$REPOSITORY_URL" ]] || \
    fatal "$INSTALL_DIR uses a different origin: $actual_origin"
  [[ -z "$(run_as_deploy git -C "$INSTALL_DIR" status --porcelain --untracked-files=normal)" ]] || \
    fatal "$INSTALL_DIR has uncommitted files; refusing to overwrite them"

  log "Checking out $REPOSITORY_REF"
  run_as_deploy git -C "$INSTALL_DIR" fetch --depth=1 origin "$REPOSITORY_REF"
  run_as_deploy git -C "$INSTALL_DIR" checkout --detach --force FETCH_HEAD

  [[ -f "$INSTALL_DIR/compose.yaml" && -f "$INSTALL_DIR/Dockerfile" ]] || \
    fatal "the selected repository revision is not a Declarative Forms deployment"
}

read_secret_file() {
  local path="$1"
  local value=""

  if [[ -n "$path" ]]; then
    value="$(<"$path")"
    [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || \
      fatal "secret files must contain exactly one line: $path"
    [[ "$value" =~ ^[A-Za-z0-9._~+/=-]+$ ]] || \
      fatal "secret file contains unsupported characters: $path"
  fi
  printf '%s' "$value"
}

existing_env_value() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { print substr($0, length(key) + 2); exit }' \
    "$INSTALL_DIR/.env"
}

configure_environment() {
  local env_file="$INSTALL_DIR/.env"
  local env_tmp
  local github_token
  local google_maps_key
  local resend_api_key
  local mongo_password
  local minio_password

  if [[ -e "$env_file" ]]; then
    [[ -f "$env_file" && ! -L "$env_file" ]] || fatal "$env_file must be a regular file"
    [[ "$(existing_env_value DOMAIN)" == "$DOMAIN" ]] || \
      fatal "existing .env uses a different DOMAIN; edit it explicitly before rerunning"
    [[ "$(existing_env_value MCP_DOMAIN)" == "mcp.$DOMAIN" ]] || \
      fatal "existing .env must set MCP_DOMAIN=mcp.$DOMAIN; edit it explicitly before rerunning"
    [[ "$(existing_env_value LETSENCRYPT_EMAIL)" == "$LETSENCRYPT_EMAIL" ]] || \
      fatal "existing .env uses a different LETSENCRYPT_EMAIL; edit it explicitly before rerunning"
    chown "$DEPLOY_USER:$DEPLOY_GROUP" "$env_file"
    chmod 0600 "$env_file"
    if [[ -n "$GITHUB_TOKEN_FILE$GOOGLE_MAPS_API_KEY_FILE$RESEND_API_KEY_FILE$RESEND_FROM_EMAIL" ]]; then
      warn "existing .env preserved; secret-file and sender options were not applied"
    fi
    return
  fi

  github_token="$(read_secret_file "$GITHUB_TOKEN_FILE")"
  google_maps_key="$(read_secret_file "$GOOGLE_MAPS_API_KEY_FILE")"
  resend_api_key="$(read_secret_file "$RESEND_API_KEY_FILE")"
  mongo_password="$(openssl rand -hex 32)"
  minio_password="$(openssl rand -hex 32)"
  env_tmp="$(mktemp "$INSTALL_DIR/.env.tmp.XXXXXX")"
  TEMP_ENV_FILE="$env_tmp"

  cat >"$env_tmp" <<EOF
DOMAIN=$DOMAIN
MCP_DOMAIN=mcp.$DOMAIN
LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL
PUBLIC_BASE_URL=https://$DOMAIN

MONGO_ROOT_USERNAME=$MONGO_ROOT_USERNAME
MONGO_ROOT_PASSWORD=$mongo_password
MONGODB_DATABASE_NAME=$MONGODB_DATABASE_NAME

MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$minio_password
MINIO_BUCKET=$MINIO_BUCKET
AWS_REGION=$AWS_REGION

CORE_PORT=8080
GITHUB_TOKEN=$github_token
VITE_GOOGLE_MAPS_API_KEY=$google_maps_key
RESEND_API_KEY=$resend_api_key
RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
EOF

  chown "$DEPLOY_USER:$DEPLOY_GROUP" "$env_tmp"
  chmod 0600 "$env_tmp"
  mv "$env_tmp" "$env_file"
  TEMP_ENV_FILE=""
}

digitalocean_public_ip() {
  curl --fail --silent --show-error \
    --connect-timeout 2 \
    --max-time 5 \
    http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address
}

verify_dns() {
  local public_ip
  local hostname
  local -a resolved_ips

  if [[ "$SKIP_DNS_CHECK" == true ]]; then
    warn "DNS-to-origin validation skipped"
    return
  fi

  public_ip="$(digitalocean_public_ip)" || \
    fatal "DigitalOcean metadata did not return this Droplet's public IPv4 address"

  for hostname in "$DOMAIN" "mcp.$DOMAIN"; do
    mapfile -t resolved_ips < <(getent ahostsv4 "$hostname" | awk '{print $1}' | sort -u)
    ((${#resolved_ips[@]} > 0)) || fatal "$hostname does not currently resolve to an IPv4 address"

    local matched=false
    for resolved_ip in "${resolved_ips[@]}"; do
      if [[ "$resolved_ip" == "$public_ip" ]]; then
        matched=true
        break
      fi
    done

    [[ "$matched" == true ]] || \
      fatal "$hostname resolves to ${resolved_ips[*]}, not this Droplet ($public_ip). Use --skip-dns-check only for an intentional proxy."
    log "DNS verified: $hostname resolves to $public_ip"
  done
}

deploy_stack() {
  log "Validating Docker Compose configuration"
  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" config --quiet

  log "Building application images"
  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" build --pull

  log "Pulling pinned service images"
  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" pull --ignore-buildable

  log "Starting the production stack"
  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" up -d --wait --wait-timeout "$WAIT_TIMEOUT"
}

verify_https() {
  local elapsed=0
  local health_body

  log "Waiting for HTTPS and Let's Encrypt certificate issuance"
  while ((elapsed < WAIT_TIMEOUT)); do
    if health_body="$(
      curl --fail --silent --show-error \
        --connect-timeout 5 \
        --max-time 15 \
        "https://$DOMAIN/healthz" 2>/dev/null
    )" && [[ "$health_body" == "ok" ]] && \
      curl --fail --silent --show-error \
        --connect-timeout 5 \
        --max-time 15 \
        --output /dev/null \
        "https://mcp.$DOMAIN/health"; then
      curl --fail --silent --show-error \
        --connect-timeout 5 \
        --max-time 15 \
        --output /dev/null \
        "https://$DOMAIN/api/v1/health"

      if [[ -n "$SMOKE_FORM" ]]; then
        curl --fail --silent --show-error \
          --connect-timeout 5 \
          --max-time 30 \
          --output /dev/null \
          "https://$DOMAIN/api/v1/forms/$SMOKE_FORM"
      fi
      return
    fi
    sleep 5
    elapsed=$((elapsed + 5))
  done

  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" logs --tail=100 traefik web api mcp scheduler >&2 || true
  fatal "HTTPS did not become healthy within $WAIT_TIMEOUT seconds"
}

main() {
  local revision

  install_base_packages
  install_docker
  configure_docker
  configure_swap
  configure_operator
  configure_firewall
  sync_repository
  configure_environment
  verify_dns
  deploy_stack
  verify_https

  revision="$(run_as_deploy git -C "$INSTALL_DIR" rev-parse --short=12 HEAD)"
  docker compose --project-directory "$INSTALL_DIR" --env-file "$INSTALL_DIR/.env" \
    -f "$INSTALL_DIR/compose.yaml" ps

  log "Declarative Forms is live at https://$DOMAIN (revision $revision)"
  log "MCP server is live at https://mcp.$DOMAIN/mcp"
  log "Production configuration: $INSTALL_DIR/.env"
  log "Persistent data is stored in Docker named volumes; enable DigitalOcean backups separately"
}

main
