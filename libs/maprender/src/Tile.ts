import { TerrainType } from 'openfront/game/src/core/game/Game.ts';

export class Tile {
  private static readonly IsLandBit = 7;
  private static readonly ShorelineBit = 6;
  private static readonly OceanBit = 5;
  private static readonly MagnitudeMask = Math.pow(2, Tile.OceanBit) - 1;

  // Основные свойства, которые передаются в конструктор
  public constructor(
    public readonly id: number,
    public readonly x: number,
    public readonly y: number,
    private readonly value: number,
  ) {}

  public get isShoreLine(): boolean {
    return Boolean(this.value & (1 << Tile.ShorelineBit));
  }

  public get isLand(): boolean {
    return Boolean(this.value & (1 << Tile.IsLandBit));
  }

  public get isOcean(): boolean {
    return Boolean(this.value & (1 << Tile.OceanBit));
  }

  public get magnitude(): number {
    return this.value & Tile.MagnitudeMask;
  }

  public get isShore(): boolean {
    return this.isShoreLine && this.isLand;
  }

  public get terrainType(): TerrainType {
    if (this.isLand) {
      if (this.magnitude < 10) return TerrainType.Plains;
      if (this.magnitude < 20) return TerrainType.Highland;
      return TerrainType.Mountain;
    }

    return this.isOcean ? TerrainType.Ocean : TerrainType.Lake;
  }
}
