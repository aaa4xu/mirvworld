FROM oven/bun:1-alpine AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

# build into binary
# @see https://bun.sh/docs/bundler/executables
RUN bun build ./packages/matches/index.ts --compile --minify --sourcemap --bytecode --outfile matches

FROM alpine:3
RUN apk add --no-cache libstdc++ libgcc

WORKDIR /app
ENV MATCHES_REPLAYS_S3_URL=http://minioadmin:minioadmin@storage:9000
ENV MATCHES_GAMELENS_S3_URL=http://minioadmin:minioadmin@storage:9000
ENV MATCHES_HTTP_PORT=80
ENV MATCHES_REDIS_URL=redis://redis:6379

COPY --from=build /usr/src/app/matches /app/
COPY ./packages/matches/drizzle ./
RUN chmod +x /app/matches

EXPOSE 80
ENTRYPOINT ["/app/matches"]