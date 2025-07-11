FROM node:24-slim AS builder
WORKDIR /usr/local/src/openfront
RUN apt-get update && apt-get install -y git

ARG GIT_COMMIT
RUN git clone https://github.com/openfrontio/OpenFrontIO.git /usr/local/src/openfront && git reset --hard $GIT_COMMIT
RUN npm install
COPY packages/game-snapshot/$GIT_COMMIT/patches/ patches/
RUN set -eux; \
    if [ -d patches ] && ls patches/*.patch >/dev/null 2>&1; then \
        for p in $(ls -1 patches/*.patch | sort); do \
            echo "🔧 Applying $p"; \
            git apply --whitespace=fix "$p"; \
        done; \
    else \
        echo "ℹ️  No patches to apply"; \
    fi

RUN npm run build-prod

# backend api mock
RUN mkdir static/api
RUN echo '{"lobbies":[]}' > static/api/public_lobbies
RUN echo '{"game_env":"prod"}' > static/api/env
RUN echo '{"exists":false}' > static/api/exists.json

FROM nginx:1.29-alpine
COPY --from=builder /usr/local/src/openfront/static /usr/share/nginx/html
COPY packages/game-snapshot/default.conf /etc/nginx/templates/default.conf.template