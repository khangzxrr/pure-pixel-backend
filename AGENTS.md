# PurePixel backend

NestJS 10 REST + Socket.IO API for the PurePixel photography marketplace (FPT University capstone). PostgreSQL via Prisma, Redis/BullMQ queues, media processed with `sharp` and stored on Bunny CDN or S3/MinIO. Swagger documents the API.

Auth depends on the branch: `main` and the `authentik` line use Authentik OIDC; older feature branches still use Keycloak. Check the code before assuming an auth API or env variable exists.

## Commands (from the repo root)

- `npm install`
- Local infra: `cd docker && docker compose up -d` (postgres, redis, Keycloak, sftpgo, pgadmin; variables come from `docker/.env`), then a root `.env` (the README lists the variables)
- `npx prisma migrate deploy`, optional `npx prisma db seed`, then `npm run start:dev` → http://localhost:3001, Swagger at `/api/` (keep the trailing slash)
- Checks: `npm run lint` (eslint `--fix`, it rewrites files), `npx tsc --noEmit -p tsconfig.json`, `npm test`
- One spec: `npx jest <name-or-path>`; coverage gate: `npm run test:cov` (90% global; plain `npm test` has no gate)
- `npm run test:e2e` boots the whole AppModule (root route only) and needs the local infra
- `npm run openapi:generate` (on branches that have it) writes gitignored `openapi.json`; the frontend's `yarn api:generate` reads `../pure-pixel-backend/openapi.json`, so generate from a checkout with this directory name

## Conventions

- Specs are co-located `*.spec.ts`; `@typescript-eslint/no-explicit-any` is an error and required-but-unused args must be prefixed `_`. Prettier runs through eslint (single quotes, trailing commas).
- Prisma: create migrations with `npx prisma migrate dev`; never edit an applied migration.
- `ENABLE_CRON=false` disables `@Cron` jobs; deployments run them in one separate process.
- The Docker image keeps the Prisma CLI and compiles the seed, so deployments migrate from it and can run `node dist/prisma/seed.js`.

## Auth

- Keycloak branches: `KEYCLOAK_*` env vars, `nest-keycloak-connect` guards and admin client, local realm in `docker/realm.json`.
- Authentik branches: `jose` verifies Authentik JWTs locally (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, optional `OIDC_JWKS_URL`); `IdentityService` manages users through the Authentik API (`AUTHENTIK_API_URL`, `AUTHENTIK_API_TOKEN`).
- Authentik PurePixel users live under path `purepixel/users`; roles are groups `purepixel:<role>` (`customer`, `photographer`, `manager`, `purepixel-admin`). Never modify Authentik users outside that path — the same instance holds NAS admin accounts.
- Never mix the two env-var families; both providers issue the same role shape, so mistakes surface at runtime.

## Deploy

- Pushing to `main` auto-deploys over SSH (`.github/workflows/main.yml`): pull, install, `npx prisma migrate deploy`, `scripts/build-image.sh`, then the server's `deploy.sh`. Do not push WIP to `main`.
