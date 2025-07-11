import { BaseLensPlugin } from '../BaseLensPlugin.ts';

export class PlaybackDurationLensPlugin extends BaseLensPlugin<unknown, unknown> {
  private turns = 0;
  private startAt = 0;

  override onTurn(turn: unknown) {
    super.onTurn(turn);
    this.turns++;
  }

  override onGameStart(runner: unknown) {
    super.onGameStart(runner);
    this.startAt = Date.now();
  }

  override onGameEnd(runner: unknown) {
    super.onGameEnd(runner);
    this.stats.setPlaybackDuration(Date.now() - this.startAt);
  }
}
