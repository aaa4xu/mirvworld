FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

# build into binary
# @see https://bun.sh/docs/bundler/executables
RUN bun build ./packages/lurker/index.ts --compile --minify --sourcemap --bytecode --outfile lurker

FROM debian:stable-slim
WORKDIR /app
ENV LURKER_S3_URL=http://minioadmin:minioadmin@storage:9000
ENV LURKER_REDIS_URL=redis://redis:6379

COPY --from=build /usr/src/app/lurker /app/
RUN chmod +x /app/lurker

ENTRYPOINT ["/app/lurker"]