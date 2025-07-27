FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY . .
RUN bun install

RUN cd packages/lurker && bun run build

FROM oven/bun:1-alpine

WORKDIR /app
COPY --from=build /app/packages/lurker/dist /app/

ENTRYPOINT ["bun", "index.js"]