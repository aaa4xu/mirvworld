import { TypedLensPlugin } from './TypedLensPlugin.ts';
import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import { PlayerType } from '../../game/src/core/game/Game.ts';

export class PlayersLensPlugin extends TypedLensPlugin {
  override onGameStart(runner: GameRunner) {
    super.onGameStart(runner);

    const players = runner.game.allPlayers().filter((p) => p.type() === PlayerType.Human);
    for (const player of players) {
      const clientId = player.clientID();
      if (!clientId) continue;

      this.stats.addPlayer({
        id: clientId,
        name: player.displayName(),
      });
    }
  }
}
