FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install --frozen-lockfile

RUN cd packages/frontend && bun --bun run build

FROM oven/bun:1
WORKDIR /app
ENV PORT=80
COPY --from=build /usr/src/app/packages/frontend/build /app
COPY --from=build /usr/src/app/node_modules /app/node_modules

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]