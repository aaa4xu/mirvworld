FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

COPY packages/openfront-client/static/maps packages/frontend/static/maps
RUN cd packages/frontend && bun --bun run build

FROM oven/bun:1
WORKDIR /app
ENV PORT=80
COPY --from=build /usr/src/app/packages/frontend/build /app
RUN bun install

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]