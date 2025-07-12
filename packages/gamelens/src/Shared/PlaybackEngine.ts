import { type LensStats } from './LensStats';

export interface PlaybackEngine<T> {
  process(replay: unknown, signal: AbortSignal): Promise<LensStats>;
}
