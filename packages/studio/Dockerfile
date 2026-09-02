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

COPY --chown=nginx:nginx --chmod=0644 packages/studio/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx --from=build /app/packages/studio/dist /usr/share/nginx/html

USER root
RUN chown nginx:nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
