FROM --platform=linux/amd64 node:18 as builder

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build && npm prune --production

##################################################################

FROM --platform=linux/amd64 node:18-slim as backend

WORKDIR /usr/src/app

COPY scripts/. ./scripts

RUN chmod +x ./scripts/*.sh


COPY --from=builder /usr/src/app/package.json ./package.json 
COPY --from=builder /usr/src/app/node_modules/. ./node_modules/
COPY --from=builder /usr/src/app/dist/. ./

ENV NODE_ENV=production

ENTRYPOINT [ "./scripts/prod.sh" ]
