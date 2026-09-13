# PurePixel Backend

The NestJS backend for **PurePixel**, a platform where photographers share, sell and get booked for photos. It was built as an FPT University capstone project.

![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)

## Overview

PurePixel lets photographers upload high-resolution photos and publish them to a social feed. They can also sell digital copies and offer photoshoot packages that customers can book. This service provides the REST API and WebSocket gateways behind the [PurePixel frontend](https://github.com/khangzxrr/pure-pixel-frontend). It handles authentication, image processing, payments, notifications and admin tooling.

## Features

- **Authentication and roles**: Keycloak (OpenID Connect) with role guards for customer, photographer, manager and admin. Keycloak admin client handles user management.
- **Photo upload pipeline**: uploads go through BullMQ queues. The pipeline rotates each image by its EXIF data, generates WebP thumbnails, applies watermarks and computes a BlurHash (all with `sharp`), then stores the files on Bunny CDN storage.
- **Duplicate and copyright detection**: perceptual hashing (`sharp-phash`) flags duplicate uploads, and TinEye reverse-image search checks for matches that already exist.
- **Photo marketplace**: sell photos at different sizes and price tags, buy them, and download purchased originals.
- **Photoshoot packages and booking**: photographers publish packages with showcase photos, and customers book them. Bookings have bill items, reviews, and photo delivery.
- **Wallet and payments**: deposits, withdrawals and user-to-user transactions. SePay provides bank-transfer QR payments and webhooks, plus scheduled clean-up of expired payments.
- **Upgrade packages**: paid plans that turn customers into photographers, with cron jobs that expire orders.
- **Social features**: newsfeed with visibility rules, likes, comments, votes, follows, bookmarks, tags, categories and blog posts.
- **Real-time features**: Socket.IO gateways (scaled with a Redis adapter) push photo-processing progress and notifications. OneSignal sends push notifications, and email goes out through Nodemailer with Handlebars templates.
- **Chat**: tokens for Stream Chat conversations.
- **Camera statistics**: a camera maker/model catalogue built from photo EXIF data, with a popularity timeline updated by cron.
- **Moderation and admin**: reports with responses, photo ban/unban, and dashboard reports for managers and admins.
- **API documentation**: Swagger UI at `/api/` with Keycloak OAuth login.

## Tech stack

| Area | Technologies |
| --- | --- |
| Framework | NestJS 10, TypeScript |
| Database | PostgreSQL, Prisma ORM (with migrations and seed) |
| Queues and cache | Redis, BullMQ, cache-manager, `@nestjs/schedule` |
| Auth | Keycloak (`nest-keycloak-connect`, Keycloak admin client), Passport basic auth |
| Storage and media | Bunny CDN storage, AWS S3 / CloudFront signed URLs, SFTPGo, `sharp`, `sharp-phash`, BlurHash, `exifr` |
| Integrations | TinEye, SePay / VietQR, OneSignal, Stream Chat, Nodemailer |
| Real-time | Socket.IO with `@socket.io/redis-adapter` |
| DevOps | Docker (multi-stage build), Docker Compose, GitHub Actions (SSH deploy) |

## Project structure

```
.
├── prisma/              # schema.prisma, migrations, seed.ts
├── docker/              # docker-compose (dev/prod), Keycloak realm export, nginx config
├── scripts/             # build/push image, deploy, DB backup/restore
├── src/
│   ├── main.ts          # bootstrap: Redis Socket.IO adapter, validation, Swagger, CORS
│   ├── authen/          # Keycloak guards and services
│   ├── photo/           # photo CRUD, processing consumers, marketplace, WebSocket gateway
│   ├── booking/         # customer <-> photographer bookings
│   ├── photoshoot-package/
│   ├── payment/         # wallet, SePay webhooks, transactions, cron clean-up
│   ├── upgrade-package/ # photographer plans
│   ├── upgrade-order/
│   ├── newsfeed/  blog/  bookmark/  photo-tag/  report/
│   ├── notification/    # in-app / push / email notifications + gateway
│   ├── chat/            # Stream Chat integration
│   ├── camera/          # camera catalogue and popularity timeline
│   ├── storage/         # Bunny, S3/CloudFront, SFTPGo, TinEye services
│   ├── user/  photographer/  admin/
│   └── infrastructure/  database/  caching/  queue/  customConfig/
└── test/                # e2e test setup
```

Each feature module uses the same layout: `controllers/`, `services/`, `dtos/`, `entities/`, `exceptions/`, and `consumers/` where it has queue workers.

## Getting started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL, Redis, Keycloak and SFTPGo)

### 1. Start the infrastructure

```bash
cd docker
docker compose up -d   # redis, postgres, keycloak (imports realm.json), sftpgo, pgadmin
```

The compose files read their own variables from a local `.env`, for example `POSTGRES_USER`, `POSTGRES_PASSWORD`, `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`, `KC_DB*` and `SFTPGO_*`.

### 2. Configure environment variables

Create a `.env` file in the project root. The application reads these variables:

| Group | Variables |
| --- | --- |
| Database | `DATABASE_URL` |
| Redis | `REDIS_URL`, `REDIS_HOSTNAME`, `REDIS_PORT` |
| Keycloak | `KEYCLOAK_AUTH_URL`, `KEYCLOAK_OPENID_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_SECRET_KEY`, `KEYCLOAK_REALM_ADMIN_USERNAME`, `KEYCLOAK_REALM_ADMIN_PASSWORD` |
| Bunny CDN | `BUNNY_STORAGE_BUCKET`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_STORAGE_CDN`, `BUNNY_PUBLIC_STORAGE_BUCKET`, `BUNNY_PUBLIC_STORAGE_ACCESS_KEY`, `BUNNY_PUBLIC_CDN`, `BUNNY_EDGE_STORAGE_CDN`, `BUNNY_EDGE_STORAGE_ACCESS_KEY`, `BUNNY_CDN_ACCESS_KEY`, `BUNNY_USER_ACCESS_KEY` |
| AWS S3 / CloudFront | `S3_URL`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENABLE_ACCELERATE`, `AWS_CLOUDFRONT_S3_ORIGIN`, `AWS_CLOUDFRONT_ACCESS_KEY`, `AWS_CLOUDFRONT_PRIVATE_KEY` |
| SFTPGo | `SFTPGO_ENDPOINT`, `SFTPGO_API_KEY` |
| TinEye | `TINEYE_ENDPOINT`, `TINEYE_USERNAME`, `TINEYE_PASSWORD` |
| Payments | `SEPAY_ACC`, `SEPAY_BANK`, `VIETQR_USERNAME`, `VIETQR_PASSWORD` |
| Notifications | `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `ONESIGNAL_USER_AUTH_KEY`, `SMTP_SERVER`, `SMTP_USERNAME`, `SMTP_PASSWORD` |
| Chat | `STREAM_ACCESS_KEY`, `STREAM_SECRET_KEY` |
| Misc | `BACKEND_ORIGIN` |

### 3. Install, migrate and run

```bash
npm install
npx prisma migrate deploy   # apply migrations
npx prisma db seed          # optional: seed data
npm run start:dev           # http://localhost:3001
```

Swagger UI is at `http://localhost:3001/api/`. Keep the trailing slash.

### Other scripts

```bash
npm run build        # compile to dist/
npm run start:prod   # node dist/src/main
npm run lint
npm run test         # unit tests (jest)
npm run test:e2e
```

## Deployment

- `dockerfile`: multi-stage Node 18 Alpine build that runs `prisma generate` and `nest build`.
- `scripts/build-image.sh` builds and pushes the `linux/amd64` image, and `scripts/deploy.sh` restarts the Compose stack.
- `.github/workflows/main.yml`: every push to `main` connects to the server over SSH, pulls the code, runs `prisma migrate deploy`, and rebuilds and redeploys the container.

## Related

- Frontend: [khangzxrr/pure-pixel-frontend](https://github.com/khangzxrr/pure-pixel-frontend) (React + Vite)

## Team

Built by Vo Ngoc Khang ([@khangzxrr](https://github.com/khangzxrr)) with [@buimanhhieu](https://github.com/buimanhhieu) as part of the PurePixel capstone team at FPT University.
