# ------------------------------------------------------
#                       Dockerfile
# ------------------------------------------------------
# image:    deploy-action
# name:     minddocdev/deploy-action
# repo:     https://github.com/minddocdev/deploy-action
# Requires: minddocdev/kubernetes-deploy:3.0.0
# authors:  development@minddoc.com
# ------------------------------------------------------

FROM minddocdev/kubernetes-deploy:3.0.0

LABEL version="0.0.1"
LABEL repository="https://github.com/minddocdev/deploy-action"
LABEL maintainer="MindDoc Health GmbH"

RUN apk add --no-cache nodejs npm

COPY lib/ /usr/src/
COPY package.json /usr/src

WORKDIR /usr/src
RUN npm install --only=prod

ENTRYPOINT ["node", "/usr/src/index.js"]
