FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY . .
RUN bun install

ARG PACKAGE_NAME
RUN cd packages/matches && bun run build

FROM oven/bun:1-alpine
ENV MATCHES_HTTP_PORT=80
WORKDIR /app
COPY --from=build /app/packages/matches/dist /app/

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]