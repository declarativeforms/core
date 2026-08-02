FROM node:22-alpine AS workspace

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/common/package.json ./packages/common/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/runtime/package.json ./packages/runtime/package.json
COPY packages/types/package.json ./packages/types/package.json

FROM workspace AS build

RUN npm ci

COPY packages ./packages

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM workspace AS api-dependencies

RUN npm ci --omit=dev \
    --workspace=@declarativeforms/types \
    --workspace=@declarativeforms/common \
    --workspace=@declarativeforms/api

FROM node:22-alpine AS api

ENV NODE_ENV=production
WORKDIR /app

COPY --from=api-dependencies /app/package.json /app/package-lock.json ./
COPY --from=api-dependencies /app/node_modules ./node_modules
COPY --from=api-dependencies /app/packages/api/package.json ./packages/api/package.json
COPY --from=api-dependencies /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=api-dependencies /app/packages/common/package.json ./packages/common/package.json
COPY --from=build /app/packages/common/dist ./packages/common/dist
COPY --from=api-dependencies /app/packages/types/package.json ./packages/types/package.json
COPY --from=build /app/packages/types/dist ./packages/types/dist

USER node
EXPOSE 8080

CMD ["node", "packages/api/dist/main.js"]

FROM nginxinc/nginx-unprivileged:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/core/dist /usr/share/nginx/html

EXPOSE 8080
