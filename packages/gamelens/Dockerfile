FROM oven/bun:1 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y git
COPY . .
RUN bun install

RUN git config --global user.email gamelens@mirv.world && git config --global user.name gamelens
RUN cd packages/openfront/game && git rev-parse --short HEAD > ../game-commit.txt && ls -la && pwd
RUN ./packages/openfront/scripts/apply_patches.sh

RUN cd packages/gamelens && bun run build

FROM oven/bun:1-alpine
WORKDIR /app
ENV GAMELENS_MAPS_PATH=/app/resources/maps

COPY --from=build /app/packages/openfront/game-commit.txt ./
COPY --from=build /app/packages/gamelens/dist /app/
COPY ./packages/openfront/game/resources/maps resources/maps

ENTRYPOINT ["bun", "index.js"]
