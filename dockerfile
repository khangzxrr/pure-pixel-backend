###################
# BUILD FOR PRODUCTION
###################

FROM node:18.19.1-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

# locked: both stages share this cache, so their installs take turns instead of racing
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm ci --include=dev --fetch-retries=5 --fetch-retry-mintimeout=20000

COPY . .

RUN npx prisma generate && npm run build

###################
# PRODUCTION
###################

FROM node:18.19.1-alpine AS production

RUN apk add --no-cache fontconfig font-roboto

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm ci --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=20000

# the lockfile keeps the prisma CLI as a production package, so migrations can run from this image
RUN npx prisma generate

COPY --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 3001

CMD [ "node", "dist/src/main" ]
