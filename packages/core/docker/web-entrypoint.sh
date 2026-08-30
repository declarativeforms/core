#!/bin/sh

set -eu

: "${GOOGLE_MAPS_API_KEY:=}"

escaped=$(printf '%s' "$GOOGLE_MAPS_API_KEY" | sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g")

cat >/usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = { googleMapsApiKey: '$escaped' };
EOF

exec /docker-entrypoint.sh "$@"
