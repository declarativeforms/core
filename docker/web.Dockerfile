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
RUN npm run build --workspace=@declarativeforms/react
RUN npm run build --workspace=@declarativeforms/web

FROM nginx:1.27-alpine AS production

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

EXPOSE 80
