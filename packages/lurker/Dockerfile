FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

# build into binary
# @see https://bun.sh/docs/bundler/executables
RUN bun build ./packages/lurker/index.ts --compile --minify --sourcemap --bytecode --outfile lurker

FROM debian:stable-slim
WORKDIR /app
VOLUME /app/storage
ENV LURKER_STATE=/app/storage/state.json
ENV LURKER_S3_ENDPOINT=http://storage:9000

COPY --from=build /usr/src/app/lurker /app/
RUN chmod +x /app/lurker

ENTRYPOINT ["/app/lurker"]