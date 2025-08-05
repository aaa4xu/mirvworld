FROM oven/bun:1-alpine AS build
WORKDIR /app
# Canvas deps
RUN apk update && apk add --no-cache \
                      build-base \
                      g++ \
                      cairo-dev \
                      jpeg-dev \
                      pango-dev \
                      giflib-dev
COPY . .
RUN bun install

RUN cd packages/lurker && bun run build

FROM oven/bun:1-alpine

WORKDIR /app
COPY --from=build /app/packages/lurker/dist /app/

ENTRYPOINT ["bun", "index.js"]