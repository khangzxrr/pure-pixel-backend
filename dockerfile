###################
# BUILD FOR PRODUCTION
###################

FROM node:18.19.1 As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node . .

RUN npm ci --include=dev && npm cache clean --force

RUN node -e 'console.log(process.arch)'

RUN npx prisma generate 

RUN npm run build

USER node

###################
# PRODUCTION
###################

FROM node:18.19.1 As production

RUN apt-get update; apt-get install -y fontconfig fonts-roboto

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/src/main" ]
