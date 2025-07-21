FROM oven/bun:1 AS build
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y git
COPY . .
RUN bun install

RUN git config --global user.email gamelens@mirv.world && git config --global user.name gamelens

RUN ./packages/openfront/scripts/apply_patches.sh

# build into binary
# @see https://bun.sh/docs/bundler/executables
# --bytecode dont't work due to *openfront.io* code
RUN bun build ./packages/gamelens/index.ts --compile --minify --sourcemap --outfile gamelens

FROM debian:stable-slim
WORKDIR /app
ENV GAMELENS_MAPS_PATH=/app/resources/maps

COPY --from=build /usr/src/app/gamelens /app/gamelens
COPY --from=build /usr/src/app/packages/openfront/game/resources/maps /app/resources/maps

RUN chmod +x /app/gamelens
ENTRYPOINT ["/app/gamelens"]