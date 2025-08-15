import { colord } from 'colord';
import type { MapTheme } from './MapTheme.ts';
import type { Tile } from '../Tile.ts';
import { TerrainType } from 'openfront/game/src/core/game/Game.ts';

export class PastelMapTheme implements MapTheme {
  readonly #shore = colord({ r: 204, g: 203, b: 158 });
  readonly #water = colord({ r: 70, g: 132, b: 180 });
  readonly #shorelineWater = colord({ r: 100, g: 143, b: 255 });

  public getTileColor(tile: Tile) {
    if (tile.isShore) {
      return this.#shore;
    }

    switch (tile.terrainType) {
      case TerrainType.Ocean:
      case TerrainType.Lake:
        if (tile.isShoreLine && !tile.isLand) {
          return this.#shorelineWater;
        }

        return colord({
          r: Math.max(this.#water.rgba.r - 10 + (11 - Math.min(tile.magnitude, 10)), 0),
          g: Math.max(this.#water.rgba.g - 10 + (11 - Math.min(tile.magnitude, 10)), 0),
          b: Math.max(this.#water.rgba.b - 10 + (11 - Math.min(tile.magnitude, 10)), 0),
        });

      case TerrainType.Plains:
        return colord({
          r: 190,
          g: 220 - 2 * tile.magnitude,
          b: 138,
        });

      case TerrainType.Highland:
        return colord({
          r: 200 + 2 * tile.magnitude,
          g: 183 + 2 * tile.magnitude,
          b: 138 + 2 * tile.magnitude,
        });

      case TerrainType.Mountain:
        return colord({
          r: 230 + tile.magnitude / 2,
          g: 230 + tile.magnitude / 2,
          b: 230 + tile.magnitude / 2,
        });

      default:
        throw new Error(`Unknown terrain type ${tile.terrainType}`);
    }
  }
}
