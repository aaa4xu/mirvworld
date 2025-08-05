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
RUN cd packages/frontend && bun run build && cd build && bun install

FROM oven/bun:1-alpine
WORKDIR /app
ENV PORT=80
ENV BACKEND_ENDPOINT=http://matches
COPY --from=build /app/packages/frontend/build/ /app

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]
