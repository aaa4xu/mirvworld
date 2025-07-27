FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY . .
RUN bun install

ARG PACKAGE_NAME
RUN cd packages/$PACKAGE_NAME && bun run build && ls -la dist && pwd

FROM oven/bun:1-alpine

ARG PACKAGE_NAME
WORKDIR /$PACKAGE_NAME
COPY --from=build /app/packages/$PACKAGE_NAME/dist /$PACKAGE_NAME/

ENTRYPOINT ["bun", "index.js"]