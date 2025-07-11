import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import { TypedLensPlugin } from './TypedLensPlugin.ts';

export class PlaybackDurationInTicksLensPlugin extends TypedLensPlugin {
  override onGameEnd(runner: GameRunner) {
    super.onGameEnd(runner);
    this.stats.setGameTicks(runner.game.ticks());
  }
}
