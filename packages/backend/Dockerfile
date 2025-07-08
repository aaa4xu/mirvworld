FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

# build into binary
# @see https://bun.sh/docs/bundler/executables
RUN bun build ./packages/backend/index.ts --compile --minify --sourcemap --bytecode --outfile backend

FROM debian:stable-slim
WORKDIR /app
VOLUME /app/storage
ENV MIRVWORLD_DATABASE=/app/storage/db/lurker.db
ENV MIRVWORLD_REPLAYS_PATH=/app/storage/replays
ENV MIRVWORLD_HTTP_PORT=80

COPY --from=build /usr/src/app/backend /app/
COPY --from=build /usr/src/app/packages/backend/drizzle /app/drizzle
RUN chmod +x /app/backend

EXPOSE 80
ENTRYPOINT ["/app/backend"]