import { type GameEndInfo, type GameRecord, type GameStartInfo } from 'openfront-client/src/core/Schemas';
import { decompressGameRecord, sanitize, simpleHash } from 'openfront-client/src/core/Util';
import { GameRunner } from 'openfront-client/src/core/GameRunner';
import { type ErrorUpdate, GameUpdateType, type GameUpdateViewData } from 'openfront-client/src/core/game/GameUpdates';
import { loadTerrainMap as loadGameMap, type NationMap } from 'openfront-client/src/core/game/TerrainMapLoader';
import { PseudoRandom } from 'openfront-client/src/core/PseudoRandom';
import { Cell, type Game, GameMapType, Nation, PlayerInfo, PlayerType } from 'openfront-client/src/core/game/Game';
import { fixProfaneUsername } from 'openfront-client/src/core/validations/username';
import { createGame } from 'openfront-client/src/core/game/GameImpl';
import { Executor } from 'openfront-client/src/core/execution/ExecutionManager';
import { prodConfig } from 'openfront-client/src/core/configuration/ProdConfig';
import { DefaultConfig } from 'openfront-client/src/core/configuration/DefaultConfig';
import { GameMapImpl, type GameMap } from 'openfront-client/src/core/game/GameMap';

export class ReplayPlayer {
  public async play(options: ReplayPlayerOptions) {
    const decompressedRecord = decompressGameRecord(options.replay);

    const gameRunner = await this.createGameRunner(options.replay.info, options.replay.info, (update) => {});

    for (let i = 0; i < decompressedRecord.turns.length; i++) {
      gameRunner.addTurn(decompressedRecord.turns[i]);
      gameRunner.executeNextTick();
      options.onProgress &&
        options.onProgress({ current: i, total: decompressedRecord.turns.length, game: gameRunner.game, turn: i });
    }

    return gameRunner.game;
  }

  private async createGameRunner(
    gameStart: GameStartInfo,
    gameInfo: GameEndInfo,
    callBack: (gu: GameUpdateViewData | ErrorUpdate) => void,
  ) {
    const terrainMapData = await this.loadTerrainMap(gameInfo.config.gameMap);
    const config = new DefaultConfig(prodConfig, gameInfo.config, null, true);
    const terrainGameMap = this.genTerrainFromBin(terrainMapData.mapBin);
    const terrainMiniMap = this.genTerrainFromBin(terrainMapData.miniMapBin);
    const random = new PseudoRandom(simpleHash(gameStart.gameID));

    const humans = gameStart.players.map(
      (p) =>
        new PlayerInfo(p.flag, fixProfaneUsername(sanitize(p.username)), PlayerType.Human, p.clientID, random.nextID()),
    );

    const nations = gameStart.config.disableNPCs
      ? []
      : terrainMapData.nationMap.nations.map(
          (n) =>
            new Nation(
              new Cell(n.coordinates[0], n.coordinates[1]),
              n.strength,
              new PlayerInfo(n.flag || '', n.name, PlayerType.FakeHuman, null, random.nextID()),
            ),
        );

    const game = createGame(humans, nations, terrainGameMap, terrainMiniMap, config);

    const gr = new GameRunner(game, new Executor(game, gameStart.gameID, 'mirvworld-replay-client'), callBack);
    gr.init();
    return gr;
  }

  private async loadTerrainMap(map: GameMapType): Promise<MapData> {
    const fileName = MAP_FILE_NAMES[map];
    if (!fileName) {
      throw new Error(`No file name mapping found for map: ${map}`);
    }

    const [mapBin, miniMapBin, nationMap] = await Promise.all([
      fetch(`/maps/${fileName}.bin`).then((r) => r.bytes()),
      fetch(`/maps/${fileName}Mini.bin`).then((r) => r.bytes()),
      fetch(`/maps/${fileName}.json`).then((r) => r.json()),
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
}

export interface ReplayPlayerOptions {
  replay: GameRecord;
  onProgress?: (progress: { current: number; total: number; game: Game; turn: number }) => void;
}

export const MAP_FILE_NAMES: Record<GameMapType, string> = {
  [GameMapType.World]: 'WorldMap',
  [GameMapType.WorldMapGiant]: 'WorldMapGiant',
  [GameMapType.Europe]: 'Europe',
  [GameMapType.Mena]: 'Mena',
  [GameMapType.NorthAmerica]: 'NorthAmerica',
  [GameMapType.Oceania]: 'Oceania',
  [GameMapType.BlackSea]: 'BlackSea',
  [GameMapType.Africa]: 'Africa',
  [GameMapType.Pangaea]: 'Pangaea',
  [GameMapType.Asia]: 'Asia',
  [GameMapType.Mars]: 'Mars',
  [GameMapType.SouthAmerica]: 'SouthAmerica',
  [GameMapType.Britannia]: 'Britannia',
  [GameMapType.GatewayToTheAtlantic]: 'GatewayToTheAtlantic',
  [GameMapType.Australia]: 'Australia',
  [GameMapType.Iceland]: 'Iceland',
  [GameMapType.Japan]: 'Japan',
  [GameMapType.BetweenTwoSeas]: 'BetweenTwoSeas',
  [GameMapType.FaroeIslands]: 'FaroeIslands',
  [GameMapType.DeglaciatedAntarctica]: 'DeglaciatedAntarctica',
  [GameMapType.EuropeClassic]: 'EuropeClassic',
  [GameMapType.FalklandIslands]: 'FalklandIslands',
  [GameMapType.Baikal]: 'Baikal',
  [GameMapType.Halkidiki]: 'Halkidiki',
  [GameMapType.Italia]: 'Italia',
  [GameMapType.StraitOfGibraltar]: 'StraitOfGibraltar',
};

export interface MapData {
  mapBin: Uint8Array;
  miniMapBin: Uint8Array;
  nationMap: NationMap;
}
