#!/bin/sh
set -eu

envsubst '${POSTHOG_API_HOST} ${POSTHOG_PROJECT_KEY}' \
  < /opt/declarativeforms/runtime-config.js.template \
  > /usr/share/nginx/html/runtime-config.js
