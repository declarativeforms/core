FROM node:lts-slim
WORKDIR /usr/src/app

# Copy workspace config + relevant packages
COPY package.json package-lock.json ./
COPY packages/engine/ packages/engine/
COPY packages/api/ packages/api/

# Install dependencies for API + engine workspaces
RUN npm install --workspace=@declarativeforms/engine --workspace=@declarativeforms/api

# Build engine, then API
RUN npm run build --workspace=@declarativeforms/engine
RUN npm run build --workspace=@declarativeforms/api

# Run tests
RUN npm test --workspace=@declarativeforms/api

CMD ["node", "packages/api/dist/main.js"]
