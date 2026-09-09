FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/api/package.json ./packages/api/
COPY packages/core/package.json ./packages/core/
COPY packages/studio/package.json ./packages/studio/

RUN npm ci --workspace=@declarativeforms/api --include-workspace-root

COPY packages/engine ./packages/engine
COPY packages/api ./packages/api

RUN npm run build --workspace=@declarativeforms/api

FROM build AS api

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "packages/api/dist/main.js"]
