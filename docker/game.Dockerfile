FROM node:24-slim AS builder
WORKDIR /usr/local/src/openfront
RUN apt-get update && apt-get install -y git

ARG GIT_BRANCH
RUN git clone --depth 1 --branch $GIT_BRANCH https://github.com/openfrontio/OpenFrontIO.git /usr/local/src/openfront
RUN npm install
RUN npm run build-prod

# backend api mock
RUN mkdir static/api
RUN echo '{"lobbies":[]}' > static/api/public_lobbies
RUN echo '{"game_env":"prod"}' > static/api/env
RUN echo '{"exists":false}' > static/api/exists.json

FROM nginx:1.29-alpine
COPY --from=builder /usr/local/src/openfront/static /usr/share/nginx/html
COPY docker/game-nginx.conf /etc/nginx/templates/default.conf.template