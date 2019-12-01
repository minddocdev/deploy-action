# ------------------------------------------------------
#                       Dockerfile
# ------------------------------------------------------
# image:    deploy
# name:     minddocdev/ci-actions/deploy
# repo:     https://github.com/minddocdev/ci-actions/deploy
# Requires: minddocdev/kubernetes-deploy:3.0.0
# authors:  development@minddoc.com
# ------------------------------------------------------

FROM minddocdev/kubernetes-deploy:3.0.0

LABEL version="0.0.1"
LABEL repository="https://github.com/minddocdev/ci-actions/deploy"
LABEL maintainer="MindDoc Health GmbH"

RUN apk add --no-cache nodejs npm

COPY lib/ /usr/src/
COPY package.json /usr/src

WORKDIR /usr/src
RUN npm install --only=prod

ENTRYPOINT ["node", "/usr/src/main.js"]
