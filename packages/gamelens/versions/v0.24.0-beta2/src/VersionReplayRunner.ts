import path from 'node:path';
import type { LensStats } from '../../../src/LensStats.ts';
import { DefaultConfig } from '../game/src/core/configuration/DefaultConfig.ts';
import { prodConfig } from '../game/src/core/configuration/ProdConfig.ts';
import { Executor } from '../game/src/core/execution/ExecutionManager.ts';
import { Cell, GameMapType, Nation, PlayerInfo, PlayerType } from '../game/src/core/game/Game.ts';
import { createGame } from '../game/src/core/game/GameImpl.ts';
import { GameMapImpl, type GameMap } from '../game/src/core/game/GameMap.ts';
import { type MapManifest, type MapMetadata, type TerrainMapData } from '../game/src/core/game/TerrainMapLoader.ts';
import { GameRunner } from '../game/src/core/GameRunner.ts';
import { PseudoRandom } from '../game/src/core/PseudoRandom.ts';
import { type GameEndInfo, type GameRecord, type GameStartInfo } from '../game/src/core/Schemas.ts';
import { decompressGameRecord, simpleHash } from '../game/src/core/Util.ts';
import { PlayersLensPlugin } from './LensPlugins/PlayersLensPlugin.ts';
import { PlaybackDurationInTicksTracker } from './LensPlugins/PlaybackDurationInTicksTracker.ts';
import type { ReplayRunner } from '../../../src/ReplayRunner.ts';
import { LensTrackerGroup } from '../../../src/LensTrackers/LensTrackerGroup.ts';
import { PlaybackDurationTracker } from '../../../src/LensTrackers/PlaybackDurationTracker.ts';

export class VersionReplayRunner implements ReplayRunner<GameRecord> {
  public constructor(private readonly mapsPath: string) {}

  public async process(replay: GameRecord, stats: LensStats) {
    const plugin = this.createStatsPlugin(stats);
    const record = decompressGameRecord(replay);
    const runner = await this.createGameRunner(record.info);

    plugin.onGameStart(runner);

    for (let i = 0; i < record.turns.length; i++) {
      plugin.onTickStart(runner);
      const turn = record.turns[i]!;
      plugin.onTurn(turn);
      runner.addTurn(turn);
      runner.executeNextTick();
      plugin.onTickEnd(runner);
    }

    plugin.onGameEnd(runner);
  }

  private createStatsPlugin(stats: LensStats) {
    return new LensTrackerGroup([
      new PlayersLensPlugin(stats),
      new PlaybackDurationTracker(stats),
      new PlaybackDurationInTicksTracker(stats),
    ]);
  }

  private async createGameRunner(replay: GameEndInfo): Promise<GameRunner> {
    const config = new DefaultConfig(prodConfig, replay.config, null, true);
    const random = new PseudoRandom(simpleHash(replay.gameID));

    const terrain = await this.loadTerrainMap(replay.config.gameMap);
    const humans = this.createHumans(replay, random);
    const nations = this.createNations(replay, random, terrain.manifest);

    const game = createGame(humans, nations, terrain.gameMap, terrain.miniGameMap, config);

    const gr = new GameRunner(game, new Executor(game, replay.gameID, 'mirvworld-replay-client'), () => {});
    gr.init();
    return gr;
  }

  private async loadTerrainMap(map: GameMapType): Promise<TerrainMapData> {
    const mapFiles = await this.loadMapData(map);

    const [gameMap, miniGameMap] = await Promise.all([
      this.genTerrainFromBin(mapFiles.manifest.map, mapFiles.mapBin),
      this.genTerrainFromBin(mapFiles.manifest.mini_map, mapFiles.miniMapBin),
    ]);

    return {
      gameMap,
      miniGameMap,
      manifest: mapFiles.manifest,
    };
  }

  private async loadMapData(map: GameMapType): Promise<MapData> {
    const key = (Object.keys(GameMapType) as Array<keyof typeof GameMapType>).find((k) => GameMapType[k] === map);
    const fileName = key!.toLowerCase();

    const [mapBin, miniMapBin, manifest] = await Promise.all([
      Bun.file(path.join(this.mapsPath, `${fileName}/map.bin`)).bytes(),
      Bun.file(path.join(this.mapsPath, `${fileName}/mini_map.bin`)).bytes(),
      Bun.file(path.join(this.mapsPath, `${fileName}/manifest.json`)).json(),
    ]);

    return {
      mapBin,
      miniMapBin,
      manifest,
    };
  }

  private genTerrainFromBin(mapData: MapMetadata, data: Uint8Array): GameMap {
    if (data.length !== mapData.width * mapData.height) {
      throw new Error(
        `Invalid data: buffer size ${data.length} incorrect for ${mapData.width}x${mapData.height} terrain. Expected ${mapData.width * mapData.height}.`,
      );
    }

    return new GameMapImpl(
      mapData.width,
      mapData.height,
      data, // Используем входной массив напрямую
      mapData.num_land_tiles,
    );
  }

  private createHumans(replay: GameStartInfo, random: PseudoRandom) {
    return replay.players.map((p) => new PlayerInfo(p.username, PlayerType.Human, p.clientID, random.nextID()));
  }

  private createNations(replay: GameStartInfo, random: PseudoRandom, manifest: MapManifest) {
    return replay.config.disableNPCs
      ? []
      : manifest.nations.map(
          (n) =>
            new Nation(
              new Cell(n.coordinates[0], n.coordinates[1]),
              n.strength,
              new PlayerInfo(n.name, PlayerType.FakeHuman, null, random.nextID()),
            ),
        );
  }
}

interface MapData {
  mapBin: Uint8Array;
  miniMapBin: Uint8Array;
  manifest: MapManifest;
}
