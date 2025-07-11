import { BaseLensPlugin } from '../../../../src/BaseLensPlugin.ts';
import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import type { Turn } from '../../game/src/core/Schemas.ts';

export class PlaybackDurationInTicksLensPlugin extends BaseLensPlugin<GameRunner, Turn> {
  override onGameEnd(runner: GameRunner) {
    super.onGameEnd(runner);
    this.stats.setGameTicks(runner.game.ticks());
  }
}
