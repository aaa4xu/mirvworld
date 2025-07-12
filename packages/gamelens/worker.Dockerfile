FROM oven/bun:1 AS build
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y git
COPY . .

ARG GAME_COMMIT
RUN bun run packages/gamelens/scripts/prepare.ts ${GAME_COMMIT}

# build into binary
# @see https://bun.sh/docs/bundler/executables
# --bytecode don't works for this project
RUN cd gamelens/${GAME_COMMIT}/src && bun install && bun build src/gamelens --compile --minify --sourcemap --outfile ../../../app

FROM debian:stable-slim
WORKDIR /app
ARG GAME_COMMIT
ENV GAMELENS_GIT_COMMIT=${GAME_COMMIT}

COPY --from=build /usr/src/app/app /app/gamelens
COPY --from=build /usr/src/app/gamelens/${GAME_COMMIT}/src/resources/maps /app/resources/maps

RUN chmod +x /app/gamelens
ENTRYPOINT ["/app/gamelens"]