import { type GameEndInfo, type GameRecord, type GameStartInfo } from 'openfront/game/src/core/Schemas';
import { DefaultConfig } from 'openfront/game/src/core/configuration/DefaultConfig.ts';
import { prodConfig } from 'openfront/game/src/core/configuration/ProdConfig.ts';
import { decompressGameRecord, simpleHash } from 'openfront/game/src/core/Util';
import { GameRunner } from 'openfront/game/src/core/GameRunner.ts';
import { Executor } from 'openfront/game/src/core/execution/ExecutionManager.ts';
import { PseudoRandom } from 'openfront/game/src/core/PseudoRandom';
import { Cell, GameMapType, Nation, PlayerInfo, PlayerType } from 'openfront/game/src/core/game/Game';
import type { MapManifest, MapMetadata, TerrainMapData } from 'openfront/game/src/core/game/TerrainMapLoader';
import path from 'node:path';
import { type GameMap, GameMapImpl } from 'openfront/game/src/core/game/GameMap';
import { GameImpl } from 'openfront/game/src/core/game/GameImpl';
import { Stats } from './Stats.ts';

export class PlaybackEngine {
  public constructor(private readonly mapsPath: string) {}

  public async process(record: GameRecord) {
    const replay = decompressGameRecord(record);

    const stats = new Stats();
    const runner = await this.createGameRunner(replay.info, stats);

    stats.startGame(runner.game);

    for (let i = 0; i < replay.turns.length; i++) {
      const turn = replay.turns[i]!;
      stats.startTurn(turn, runner.game);
      runner.addTurn(turn);
      runner.executeNextTick();
      stats.endTurn(runner.game);
    }

    stats.endGame(runner.game);

    return stats.getEvents();
  }

  private async createGameRunner(replay: GameEndInfo, stats: Stats): Promise<GameRunner> {
    const config = new DefaultConfig(prodConfig, replay.config, null, true);
    const random = new PseudoRandom(simpleHash(replay.gameID));

    const terrain = await this.loadTerrainMap(replay.config.gameMap);
    const humans = this.createHumans(replay, random);
    const nations = this.createNations(replay, random, terrain.manifest);

    const game = new GameImpl(humans, nations, terrain.gameMap, terrain.miniGameMap, config, stats);

    const gr = new GameRunner(game, new Executor(game, replay.gameID, 'mirvworld-replay-client'), () => {});
    gr.init();
    return gr;
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

    return new GameMapImpl(mapData.width, mapData.height, data, mapData.num_land_tiles);
  }
}

interface MapData {
  mapBin: Uint8Array;
  miniMapBin: Uint8Array;
  manifest: MapManifest;
}
