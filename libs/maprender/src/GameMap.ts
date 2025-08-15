import { Tile } from './Tile.ts';

export class GameMap {
  public readonly tiles: ReadonlyArray<Tile>;

  public constructor(
    data: Uint8Array,
    public readonly width: number,
    public readonly height: number,
  ) {
    this.tiles = data.reduce((acc, v, i) => {
      acc[i] = new Tile(i, i % width, Math.floor(i / width), v);
      return acc;
    }, new Array<Tile>(data.length));
  }

  public getTile(x: number, y: number) {
    return this.tiles[y * this.width + x];
  }
}
