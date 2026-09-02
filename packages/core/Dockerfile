FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/studio/package.json ./packages/studio/

RUN npm ci \
      --workspace=@declarativeforms/core \
      --workspace=@declarativeforms/engine \
      --include-workspace-root

COPY packages/engine ./packages/engine
COPY packages/core ./packages/core

COPY contact.yaml kitchen-sink.yaml ./

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@declarativeforms/engine \
 && npm run build --workspace=@declarativeforms/core

FROM node:22-alpine AS web

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

COPY --from=build /app/packages/core/.next/standalone ./
COPY --from=build /app/packages/core/.next/static ./packages/core/.next/static
COPY --from=build /app/packages/core/public ./packages/core/public

RUN mkdir -p /app/packages/core/.next/cache && chown -R node:node /app

USER node

EXPOSE 8080

CMD ["node", "packages/core/server.js"]
