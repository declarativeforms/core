FROM node:22-alpine AS workspace

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/engine/package.json ./packages/engine/package.json

FROM workspace AS build

RUN npm ci

COPY packages ./packages

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Run the API from the build image so every workspace dependency resolves.
# (Not size-optimized; a production build would prune to a lean runtime image.)
FROM build AS api

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "packages/api/dist/main.js"]

FROM nginxinc/nginx-unprivileged:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/core/dist /usr/share/nginx/html

EXPOSE 8080
