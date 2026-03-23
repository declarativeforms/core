FROM node:lts-slim
WORKDIR /usr/src/app

# Copy workspace config + relevant packages
COPY package.json package-lock.json ./
COPY packages/types/ packages/types/
COPY packages/common/ packages/common/
COPY packages/api/ packages/api/

# Install dependencies for API + types + common workspaces
RUN npm install --workspace=@declarativeforms/types --workspace=@declarativeforms/common --workspace=@declarativeforms/api

# Build types, then common, then API
RUN npm run build --workspace=@declarativeforms/types
RUN npm run build --workspace=@declarativeforms/common
RUN npm run build --workspace=@declarativeforms/api

# Run tests
RUN npm test --workspace=@declarativeforms/api

CMD ["node", "packages/api/dist/main.js"]
