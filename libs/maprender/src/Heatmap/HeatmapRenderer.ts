import type { SpawnStats } from './SpawnStats.ts';
import type { GameMap } from '../GameMap.ts';
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
extend([mixPlugin]);

export class HeatmapRenderer {
  private static readonly ViridisColorTheme = [
    '#28a745', // Green (0.0)
    '#fde725', // Yellow (0.5)
    '#dc3545', // Red (1.0)
  ] as const;

  public constructor(
    private readonly config: {
      useCountAsWeight: boolean;
      radiusMultiplier: number;
      radiusMaxPercent: number;
      radiusMinPx: number;
      alpha: number;
    },
  ) {}

  public render(map: GameMap, spawns: ReadonlyArray<SpawnStats>): Uint8ClampedArray {
    const points = this.filterInBounds(spawns, map.width, map.height);
    const radius = this.radiusHeuristic(points.length, map.width, map.height);
    const { valueGrid, weightGrid } = this.accumulate(map, points, radius);
    const { actualMax, actualMin, smoothed } = this.preprocess(valueGrid, weightGrid);

    const range = actualMax - actualMin;
    const validRange = Number.isFinite(range) && range > 0;

    const pixels = new Uint8ClampedArray(map.tiles.length * 4);
    for (let i = 0; i < smoothed.length; i++) {
      const value = smoothed[i]!;
      if (value < 0) continue; // no data

      const n = validRange ? (value - actualMin) / range : 0.5; // full-contrast fallback
      const { r, g, b } = this.colorize(n);

      const off = i * 4;
      // noinspection PointlessArithmeticExpressionJS
      pixels[off + 0] = r;
      pixels[off + 1] = g;
      pixels[off + 2] = b;
      pixels[off + 3] = this.config.alpha;
    }

    return pixels;
  }

  /**
   * Filters out-of-bounds points
   */
  private filterInBounds(points: ReadonlyArray<SpawnStats>, mapWidth: number, mapHeight: number): SpawnStats[] {
    return points.filter((p) => p.x >= 0 && p.x < mapWidth && p.y >= 0 && p.y < mapHeight);
  }

  /**
   * Processes the given map and points to compute grids of values and weights
   * based on the specified radius
   */
  private accumulate(map: GameMap, points: SpawnStats[], radius: number) {
    const valueGrid = new Float32Array(map.width * map.height);
    const weightGrid = new Float32Array(map.width * map.height);
    const r2 = radius * radius;

    for (const p of points) {
      const px = Math.round(p.x);
      const py = Math.round(p.y);

      const startX = Math.max(0, px - radius);
      const endX = Math.min(map.width, px + radius);
      const startY = Math.max(0, py - radius);
      const endY = Math.min(map.height, py + radius);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r2) continue;

          const tile = map.getTile(x, y);
          if (!tile || !tile.isLand) continue;

          const distanceWeight = 1 - d2 / r2;
          const finalWeight = this.config.useCountAsWeight ? distanceWeight * p.count : distanceWeight;
          const idx = y * map.width + x;

          valueGrid[idx]! += p.mean * finalWeight;
          weightGrid[idx]! += finalWeight;
        }
      }
    }

    return { valueGrid, weightGrid };
  }

  /**
   * Preprocesses the given value and weight grids by computing a smoothed array and determining the data range.
   */
  private preprocess(valueGrid: Float32Array, weightGrid: Float32Array) {
    let actualMin = Number.POSITIVE_INFINITY;
    let actualMax = Number.NEGATIVE_INFINITY;
    const smoothed = new Float32Array(valueGrid.length).fill(-1);

    for (let i = 0; i < valueGrid.length; i++) {
      const w = weightGrid[i]!;
      if (w > 0) {
        const v = valueGrid[i]! / w;
        smoothed[i] = v;
        if (v < actualMin) actualMin = v;
        if (v > actualMax) actualMax = v;
      }
    }

    return { actualMax, actualMin, smoothed };
  }

  /**
   * Calculates a heuristic radius value for points on a map based on the number of points
   * and the dimensions of the map
   */
  private radiusHeuristic(numPoints: number, mapWidth: number, mapHeight: number) {
    // Edge case: 0..1 points => return 10% of min side
    if (numPoints < 2) {
      return Math.round(Math.min(mapWidth, mapHeight) * 0.1);
    }

    const mapArea = mapWidth * mapHeight;
    const avgAreaPerPoint = mapArea / numPoints;
    const baseRadius = Math.sqrt(avgAreaPerPoint / Math.PI);
    let r = baseRadius * this.config.radiusMultiplier;

    const maxR = Math.min(mapWidth, mapHeight) * this.config.radiusMaxPercent;
    r = Math.max(this.config.radiusMinPx, r);
    r = Math.min(maxR, r);

    return Math.round(r);
  }

  /**
   * Method maps a numeric value to a color gradient transitioning from green to yellow to red
   */
  private colorize(value: number) {
    const clamped = Math.min(1, Math.max(0, value));

    // Map value to adjacent stops
    const maxIdx = HeatmapRenderer.ViridisColorTheme.length - 1;
    const pos = clamped * maxIdx;
    const i = Math.floor(pos);
    const t = pos - i;

    const from = HeatmapRenderer.ViridisColorTheme[i]!;
    const to = HeatmapRenderer.ViridisColorTheme[Math.min(i + 1, maxIdx)]!;

    // Interpolate with colord and return integer RGB
    const { r, g, b } = colord(from).mix(to, t).toRgb();
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }
}
