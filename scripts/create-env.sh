#!/bin/sh

set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: ./scripts/create-env.sh forms.example.com admin@example.com" >&2
  exit 1
fi

domain=$1
email=$2

case "$domain" in
  *[!A-Za-z0-9.-]*|'')
    echo "The domain may contain only letters, numbers, dots, and hyphens." >&2
    exit 1
    ;;
esac

case "$email" in
  *[!A-Za-z0-9._%+@-]*|*@*@*|@*|*@|'')
    echo "Enter a simple email address without spaces." >&2
    exit 1
    ;;
esac
case "$email" in
  *@*.*) ;;
  *)
    echo "Enter an email address such as admin@example.com." >&2
    exit 1
    ;;
esac

if [ -e .env ]; then
  echo ".env already exists; refusing to overwrite it." >&2
  exit 1
fi

api_key=$(openssl rand -hex 32)
jwt_secret=$(openssl rand -hex 32)
mongo_password=$(openssl rand -hex 32)
minio_root_password=$(openssl rand -hex 32)
minio_app_password=$(openssl rand -hex 32)

umask 077
sed \
  -e "s/forms\\.example\\.com/$domain/" \
  -e "s/admin@example\\.com/$email/" \
  -e "s/replace-with-a-long-random-value/$api_key/" \
  -e "s/replace-with-another-long-random-value/$jwt_secret/" \
  -e "s/replace-with-a-long-url-safe-password/$mongo_password/" \
  -e "s/replace-with-a-long-minio-password/$minio_root_password/" \
  -e "s/replace-with-a-different-long-minio-password/$minio_app_password/" \
  .env.example >.env

echo "Created .env with generated secrets for $domain."
