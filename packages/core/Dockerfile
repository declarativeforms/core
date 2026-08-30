FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/

RUN npm ci --workspace=@declarativeforms/core --include-workspace-root

COPY packages/engine ./packages/engine
COPY packages/core ./packages/core

COPY contact.yaml kitchen-sink.yaml ./

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build --workspace=@declarativeforms/core

FROM nginxinc/nginx-unprivileged:1.27-alpine AS web

COPY --chown=nginx:nginx --chmod=0644 packages/core/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx --from=build /app/packages/core/dist /usr/share/nginx/html
COPY --chmod=0755 packages/core/docker/web-entrypoint.sh /usr/local/bin/web-entrypoint.sh

USER root
RUN chown nginx:nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/web-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
