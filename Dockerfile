FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/main.js"]
