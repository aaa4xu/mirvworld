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

RUN cd packages/gateway && bun run build

FROM oven/bun:1-alpine
ENV GW_HTTP_PORT=80
WORKDIR /app
COPY --from=build /app/packages/gateway/dist /app/
EXPOSE 80
ENTRYPOINT ["bun", "index.js"]