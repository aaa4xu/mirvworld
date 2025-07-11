import { LensStats } from '../LensStats.ts';
import type { LensTracker } from './LensTracker.ts';

export class BaseLensTracker<GameRunner, Turn> implements LensTracker<GameRunner, Turn> {
  public constructor(protected readonly stats: LensStats) {}

  onGameStart(runner: GameRunner) {}

  onGameEnd(runner: GameRunner) {}

  onTickStart(runner: GameRunner) {}

  onTickEnd(runner: GameRunner) {}

  onTurn(turn: Turn) {}
}
