FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/web/package.json ./packages/web/package.json

RUN npm ci
COPY packages ./packages
RUN npm run build --workspace=@declarativeforms/core
RUN npm run build --workspace=@declarativeforms/api

FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/web/package.json ./packages/web/package.json
RUN npm ci --omit=dev --workspace=@declarativeforms/api --include-workspace-root=false

COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/api/dist ./packages/api/dist

USER node
EXPOSE 8080

CMD ["node", "packages/api/dist/main.js"]
