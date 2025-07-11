import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import type { Turn } from '../../game/src/core/Schemas.ts';
import { BaseLensPlugin } from '../../../../src/BaseLensPlugin.ts';
import { type LensStats } from '../../../../src/LensStats.ts';
import { PlayerType } from '../../game/src/core/game/Game.ts';

export class PlayersLensPlugin extends BaseLensPlugin<GameRunner, Turn> {
  public constructor(stats: LensStats) {
    super(stats);
  }

  public override onGameStart(runner: GameRunner): void {
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
