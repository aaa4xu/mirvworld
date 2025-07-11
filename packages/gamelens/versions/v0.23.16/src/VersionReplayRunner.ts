import { MAP_FILE_NAMES } from '../game/src/core/game/TerrainMapFileLoader.ts';
import { type GameEndInfo, type GameRecord, type GameStartInfo } from '../game/src/core/Schemas.ts';
import { DefaultConfig } from '../game/src/core/configuration/DefaultConfig.ts';
import { prodConfig } from '../game/src/core/configuration/ProdConfig.ts';
import { PseudoRandom } from '../game/src/core/PseudoRandom.ts';
import { decompressGameRecord, simpleHash } from '../game/src/core/Util.ts';
import { GameMapImpl, type GameMap } from '../game/src/core/game/GameMap.ts';
import { Cell, GameMapType, Nation, PlayerInfo, PlayerType } from '../game/src/core/game/Game.ts';
import type { NationMap } from '../game/src/core/game/TerrainMapLoader.ts';
import { createGame } from '../game/src/core/game/GameImpl.ts';
import { GameRunner } from '../game/src/core/GameRunner.ts';
import { Executor } from '../game/src/core/execution/ExecutionManager.ts';
import type { LensStats } from '../../../src/LensStats.ts';
import path from 'node:path';
import type { ReplayRunner } from '../../../src/ReplayRunner.ts';
import { LensTrackerGroup } from '../../../src/LensTrackers/LensTrackerGroup.ts';
import { PlayersTrackers } from './LensTrackers/PlayersTrackers.ts';
import { PlaybackDurationTracker } from '../../../src/LensTrackers/PlaybackDurationTracker.ts';
import { PlaybackDurationInTicksTracker } from './LensTrackers/PlaybackDurationInTicksTracker.ts';

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
      new PlayersTrackers(stats),
      new PlaybackDurationTracker(stats),
      new PlaybackDurationInTicksTracker(stats),
    ]);
  }

  private async createGameRunner(replay: GameEndInfo): Promise<GameRunner> {
    const config = new DefaultConfig(prodConfig, replay.config, null, true);
    const random = new PseudoRandom(simpleHash(replay.gameID));

    const terrain = await this.loadTerrainMap(replay.config.gameMap);
    const humans = this.createHumans(replay, random);
    const nations = this.createNations(replay, random, terrain.nationMap);

    const game = createGame(humans, nations, terrain.gameMap, terrain.miniGameMap, config);

    const gr = new GameRunner(game, new Executor(game, replay.gameID, 'mirvworld-replay-client'), () => {});
    gr.init();
    return gr;
  }

  private async loadTerrainMap(map: GameMapType) {
    const mapFiles = await this.loadMapData(map);

    const [gameMap, miniGameMap] = await Promise.all([
      this.genTerrainFromBin(mapFiles.mapBin),
      this.genTerrainFromBin(mapFiles.miniMapBin),
    ]);

    return {
      nationMap: mapFiles.nationMap,
      gameMap: gameMap,
      miniGameMap: miniGameMap,
    };
  }

  private async loadMapData(map: GameMapType): Promise<MapData> {
    const fileName = MAP_FILE_NAMES[map];
    if (!fileName) {
      throw new Error(`No file name mapping found for map: ${map}`);
    }

    const [mapBin, miniMapBin, nationMap] = await Promise.all([
      Bun.file(path.join(this.mapsPath, `${fileName}.bin`)).bytes(),
      Bun.file(path.join(this.mapsPath, `${fileName}Mini.bin`)).bytes(),
      Bun.file(path.join(this.mapsPath, `${fileName}.json`)).json(),
    ]);

    return {
      mapBin,
      miniMapBin,
      nationMap,
    };
  }

  private genTerrainFromBin(data: Uint8Array): GameMap {
    const width = (data[1]! << 8) | data[0]!;
    const height = (data[3]! << 8) | data[2]!;

    if (data.length !== width * height + 4) {
      throw new Error(
        `Invalid data: buffer size ${data.length} incorrect for ${width}x${height} terrain plus 4 bytes for dimensions (${width * height + 4}).`,
      );
    }

    // Store raw data in Uint8Array
    const rawData = new Uint8Array(width * height);
    let numLand = 0;

    // Copy data starting after the header
    for (let i = 0; i < width * height; i++) {
      const packedByte = data[i + 4]!;
      rawData[i] = packedByte;
      if (packedByte & 0b10000000) numLand++;
    }

    return new GameMapImpl(width, height, rawData, numLand);
  }

  private createHumans(replay: GameStartInfo, random: PseudoRandom) {
    return replay.players.map((p) => new PlayerInfo(p.flag, p.username, PlayerType.Human, p.clientID, random.nextID()));
  }

  private createNations(replay: GameStartInfo, random: PseudoRandom, nationsMap: NationMap) {
    return replay.config.disableNPCs
      ? []
      : nationsMap.nations.map(
          (n) =>
            new Nation(
              new Cell(n.coordinates[0], n.coordinates[1]),
              n.strength,
              new PlayerInfo(n.flag || '', n.name, PlayerType.FakeHuman, null, random.nextID()),
            ),
        );
  }
}

interface MapData {
  mapBin: Uint8Array;
  miniMapBin: Uint8Array;
  nationMap: NationMap;
}
