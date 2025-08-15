import type { Tile } from '../Tile.ts';
import type { Colord } from 'colord';

export interface MapTheme {
  getTileColor(tile: Tile): Colord;
}
