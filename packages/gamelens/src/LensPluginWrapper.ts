import type { LensPlugin } from './LensPlugin.ts';

export class LensPluginWrapper<GameRunner, Turn> implements LensPlugin<GameRunner, Turn> {
  public constructor(protected readonly plugins: ReadonlyArray<LensPlugin<GameRunner, Turn>>) {}

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
