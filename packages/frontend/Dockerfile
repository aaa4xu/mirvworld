FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY . .
RUN bun install

RUN cd packages/frontend && bun run build

FROM oven/bun:1
WORKDIR /app
ENV PORT=80
ENV REDIS_URL=redis://redis:6379
COPY --from=build /usr/src/app/packages/frontend/build /app
RUN bun install

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]