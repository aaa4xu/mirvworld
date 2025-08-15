import { GameMapType } from 'openfront/game/src/core/game/Game';
import type { GameMapLoader, MapData } from 'openfront/game/src/core/game/GameMapLoader';
import path from 'node:path';

export class BunGameMapLoader implements GameMapLoader {
  public constructor(private readonly root: string) {}

  public getMapData(map: GameMapType): MapData {
    const fileName = this.mapTypeToFilename(map);

    if (!fileName) {
      throw new Error(`Unknown map: ${map}`);
    }

    return {
      manifest: () => Bun.file(this.filepath(fileName, 'manifest.json')).json(),
      webpPath: async () => this.filepath(fileName, 'thumbnail.webp'),
      miniMapBin: () => Bun.file(this.filepath(fileName, 'mini_map.bin')).bytes(),
      mapBin: () => Bun.file(this.filepath(fileName, 'map.bin')).bytes(),
    };
  }

  private mapTypeToFilename(map: GameMapType): string {
    const key = Object.keys(GameMapType).find((k) => GameMapType[k as keyof typeof GameMapType] === map);
    return key?.toLowerCase() ?? '';
  }

  private filepath(map: string, filename: string): string {
    return path.join(this.root, map, filename);
  }
}
