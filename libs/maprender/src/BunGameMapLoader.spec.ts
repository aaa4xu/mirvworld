import { describe, expect, it } from 'bun:test';
import { BunGameMapLoader } from './BunGameMapLoader.ts';
import { GameMapType } from 'openfront/game/src/core/game/Game.ts';

describe('BunGameMapLoader', () => {
  it('should correctly read map data from game files', async () => {
    const loader = new BunGameMapLoader('../../packages/openfront/game/resources/maps');
    const mapDataConfig = loader.getMapData(GameMapType.BetweenTwoSeas);
    const [manifest, map] = await Promise.all([mapDataConfig.manifest(), mapDataConfig.mapBin()]);

    expect(manifest.map.height).toBe(1062);
    expect(manifest.map.width).toBe(1778);
    expect(map.byteLength).toBe(manifest.map.height * manifest.map.width);
  });
});
