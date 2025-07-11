import type { LensTracker } from './LensTracker.ts';

export class LensTrackerGroup<GameRunner, Turn> implements LensTracker<GameRunner, Turn> {
  public constructor(protected readonly plugins: ReadonlyArray<LensTracker<GameRunner, Turn>>) {}

  public onGameStart(runner: GameRunner) {
    for (const plugin of this.plugins) {
      plugin.onGameStart(runner);
    }
  }

  public onGameEnd(runner: GameRunner) {
    for (const plugin of this.plugins) {
      plugin.onGameEnd(runner);
    }
  }

  public onTickStart(runner: GameRunner) {
    for (const plugin of this.plugins) {
      plugin.onTickStart(runner);
    }
  }

  public onTickEnd(runner: GameRunner) {
    for (const plugin of this.plugins) {
      plugin.onTickEnd(runner);
    }
  }

  public onTurn(turn: Turn) {
    for (const plugin of this.plugins) {
      plugin.onTurn(turn);
    }
  }
}
