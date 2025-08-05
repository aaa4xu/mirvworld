FROM oven/bun:1-alpine AS base
WORKDIR /app
# Canvas deps
RUN apk update && apk add --no-cache \
                      build-base \
                      g++ \
                      cairo-dev \
                      jpeg-dev \
                      pango-dev \
                      giflib-dev

FROM base AS build
COPY . .
RUN bun install
RUN cd packages/frontend && bun run build

FROM base
ENV PORT=80
ENV BACKEND_ENDPOINT=http://matches
COPY --from=build /app/packages/frontend/build/ /app
RUN bun install canvas

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]
