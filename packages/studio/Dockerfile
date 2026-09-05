FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/studio/package.json ./packages/studio/

RUN npm ci \
      --workspace=@declarativeforms/studio \
      --include-workspace-root

COPY packages/studio ./packages/studio

RUN npm run build --workspace=@declarativeforms/studio

FROM nginxinc/nginx-unprivileged:1.27-alpine AS studio

ENV API_INTERNAL_ORIGIN=http://api:8080 \
    POSTHOG_API_HOST=https://us.i.posthog.com \
    POSTHOG_PROJECT_KEY=

COPY --chown=nginx:nginx --chmod=0644 packages/studio/docker/default.conf.template \
     /etc/nginx/templates/default.conf.template
COPY --chown=nginx:nginx --chmod=0644 packages/studio/docker/runtime-config.js.template \
     /opt/declarativeforms/runtime-config.js.template
COPY --chown=nginx:nginx --chmod=0755 packages/studio/docker/40-runtime-config.sh \
     /docker-entrypoint.d/40-runtime-config.sh
COPY --chown=nginx:nginx --from=build /app/packages/studio/dist /usr/share/nginx/html

USER root
RUN chmod 0755 /etc/nginx/templates /opt/declarativeforms \
    && chown nginx:nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
