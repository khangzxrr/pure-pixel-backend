###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18.19.1-alpine As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm ci --include=dev

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18.19.1-alpine As build

ENV DATABASE_URL=$DATABASE_URL
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
ENV S3_URL=$S3_URL
ENV S3_REGION=$S3_REGION
ENV S3_BUCKET=$S3_BUCKET

ENV SFTPGO_ENDPOINT=$SFTPGO_ENDPOINT
ENV SFTPGO_SFTP_ENDPOINT=$SFTPGO_SFTP_ENDPOINT
ENV SFTPGO_API_KEY=$SFTPGO_API_KEY
ENV REDIS_URL=$REDIS_URL

ENV IMAGINARY_ENDPOINT=$IMAGINARY_ENDPOINT

ENV KEYCLOAK_AUTH_URL=$KEYCLOAK_AUTH_URL
ENV KEYCLOAK_REALM=$KEYCLOAK_REALM
ENV KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
ENV KEYCLOAK_SECRET_KEY=$KEYCLOAK_SECRET_KEY
ENV KEYCLOAK_OPENID_URL=$KEYCLOAK_OPENID_URL

ENV ONESIGNAL_USER_AUTH_KEY=$ONESIGNAL_USER_AUTH_KEY
ENV ONESIGNAL_REST_API_KY=$ONESIGNAL_REST_API_KY
ENV ONESIGNAL_APP_ID=$ONESIGNAL_APP_ID

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN npm ci --include=dev && npm cache clean --force

RUN npm run build

USER node

###################
# PRODUCTION
###################

FROM node:18.19.1-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/src/main" ]