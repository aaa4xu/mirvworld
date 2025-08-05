FROM oven/bun:1 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y git build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
COPY . .
RUN bun install

RUN cd packages/frontend && bun run build

FROM oven/bun:1
WORKDIR /app
ENV PORT=80
ENV BACKEND_ENDPOINT=http://matches
COPY --from=build /app/packages/frontend/build /app
RUN bun install

EXPOSE 80
ENTRYPOINT ["bun", "index.js"]
