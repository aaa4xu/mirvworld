import type { LensStats } from './LensStats.ts';

export interface ReplayRunner<GameRecord> {
  process(replay: GameRecord, stats: LensStats): Promise<void>;
}
