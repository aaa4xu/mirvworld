import { type MapTheme } from './MapTheme.ts';
import type { GameMap } from '../GameMap.ts';

export class TerrainRenderer {
  public constructor(private readonly theme: MapTheme) {}

  public render(map: GameMap): Uint8ClampedArray {
    return map.tiles.reduce(
      (acc, value, index) => {
        const color = this.theme.getTileColor(value);
        // noinspection PointlessArithmeticExpressionJS
        acc[index * 4 + 0] = color.rgba.r;
        acc[index * 4 + 1] = color.rgba.g;
        acc[index * 4 + 2] = color.rgba.b;
        acc[index * 4 + 3] = (color.rgba.a * 255) | 0;

        return acc;
      },
      new Uint8ClampedArray(map.tiles.length * 4),
    );
  }
}
