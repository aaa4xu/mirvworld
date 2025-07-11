import type { GameRunner } from '../../game/src/core/GameRunner.ts';
import type { Turn } from '../../game/src/core/Schemas.ts';
import { type LensStats } from '../../../../src/LensStats.ts';
import { PlayerType } from '../../game/src/core/game/Game.ts';
import { BaseLensTracker } from '../../../../src/LensTrackers/BaseLensTracker.ts';

export class PlayersLensPlugin extends BaseLensTracker<GameRunner, Turn> {
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
