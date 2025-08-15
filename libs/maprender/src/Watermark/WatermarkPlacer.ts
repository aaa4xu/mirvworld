import type { GameMap } from '../GameMap.ts';

export class WatermarkPlacer {
  public constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly minOffset: number,
    public readonly maxOffset: number,
  ) {}

  public findBestPosition(map: GameMap): { x: number; y: number } {
    const searchAreas = {
      topLeft: {
        startX: this.minOffset,
        endX: this.maxOffset,
        startY: this.minOffset,
        endY: this.maxOffset,
      },
      topRight: {
        startX: map.width - this.width - this.maxOffset,
        endX: map.width - this.width - this.minOffset,
        startY: this.minOffset,
        endY: this.maxOffset,
      },
      bottomLeft: {
        startX: this.minOffset,
        endX: this.maxOffset,
        startY: map.height - this.height - this.maxOffset,
        endY: map.height - this.height - this.minOffset,
      },
      bottomRight: {
        startX: map.width - this.width - this.maxOffset,
        endX: map.width - this.width - this.minOffset,
        startY: map.height - this.height - this.maxOffset,
        endY: map.height - this.height - this.minOffset,
      },
    };

    let bestOverallPosition = { x: this.minOffset, y: this.minOffset };
    let minOverallLandOverlap = Infinity;

    for (const area of Object.values(searchAreas)) {
      const { bestPosition, minOverlap } = this.searchAreaForBestPosition(
        map,
        this.width,
        this.height,
        area.startX,
        area.endX,
        area.startY,
        area.endY,
      );

      if (minOverlap < minOverallLandOverlap) {
        minOverallLandOverlap = minOverlap;
        bestOverallPosition = bestPosition;
      }

      if (minOverallLandOverlap === 0) {
        break;
      }
    }

    return bestOverallPosition;
  }

  private searchAreaForBestPosition(
    map: GameMap,
    watermarkWidth: number,
    watermarkHeight: number,
    startX: number,
    endX: number,
    startY: number,
    endY: number,
  ): { bestPosition: { x: number; y: number }; minOverlap: number } {
    let bestLocalPosition = { x: startX, y: startY };
    let minLocalOverlap = Infinity;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (x < 0 || y < 0 || x + watermarkWidth > map.width || y + watermarkHeight > map.height) {
          continue;
        }

        const currentOverlap = this.calculateLandOverlap(map, x, y, watermarkWidth, watermarkHeight);

        if (currentOverlap < minLocalOverlap) {
          minLocalOverlap = currentOverlap;
          bestLocalPosition = { x, y };
        }

        if (minLocalOverlap === 0) {
          return { bestPosition: bestLocalPosition, minOverlap: minLocalOverlap };
        }
      }
    }

    return { bestPosition: bestLocalPosition, minOverlap: minLocalOverlap };
  }

  private calculateLandOverlap(map: GameMap, startX: number, startY: number, width: number, height: number): number {
    let landCount = 0;
    const endX = Math.min(map.width, startX + width);
    const endY = Math.min(map.height, startY + height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = map.getTile(x, y);
        if (tile && tile.isLand) {
          landCount++;
        }
      }
    }

    return landCount;
  }
}
