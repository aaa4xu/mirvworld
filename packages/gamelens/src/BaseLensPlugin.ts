import { LensStats } from './LensStats.ts';
import type { LensPlugin } from './LensPlugin.ts';

export class BaseLensPlugin<GameRunner, Turn> implements LensPlugin<GameRunner, Turn> {
  public constructor(protected readonly stats: LensStats) {}

  onGameStart(runner: GameRunner) {}

  onGameEnd(runner: GameRunner) {}

  onTickStart(runner: GameRunner) {}

  onTickEnd(runner: GameRunner) {}

  onTurn(turn: Turn) {}
}
