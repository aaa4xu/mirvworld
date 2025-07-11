import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import { TypedLensTracker } from './TypedLensTracker.ts';

export class PlaybackDurationInTicksTracker extends TypedLensTracker {
  override onGameEnd(runner: GameRunner) {
    super.onGameEnd(runner);
    this.stats.setGameTicks(runner.game.ticks());
  }
}
