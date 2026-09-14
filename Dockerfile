# Image staví CI. Na serveru se nic nestaví.
# Razítko verze je až na konci, aby verze sdílely vrstvy.

FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci --ignore-scripts

FROM deps AS build
COPY apps ./apps
RUN npm run build -w @ksirovka/web && npm run build -w @ksirovka/api

FROM node:22-alpine AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --ignore-scripts -w @ksirovka/api

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /repo/apps/web/dist ./web-dist
ENV WEB_DIST=/app/web-dist
ENV API_HOST=0.0.0.0
ENV API_PORT=3801
USER node
EXPOSE 3801
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]

ARG APP_VERSION=dev
ARG APP_COMMIT=dev
ARG APP_BUILT_AT=dev
ENV APP_VERSION=$APP_VERSION APP_COMMIT=$APP_COMMIT APP_BUILT_AT=$APP_BUILT_AT
