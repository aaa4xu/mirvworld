import type { PlayersService } from '../Services/PlayersService.ts';
import { OpenFrontPublicAPI } from '@mirvworld/openfront-api';

export class LeaderboardPlayersImporter {
  private stopped = false;

  public constructor(
    private readonly players: PlayersService,
    private readonly api: OpenFrontPublicAPI,
  ) {
    this.start();
  }

  public stop() {
    this.stopped = true;
  }

  public async start() {
    console.log(`[${this.constructor.name}] Started`);

    while (!this.stopped) {
      try {
        await this.tick();
      } catch (err) {
        console.log(`[${this.constructor.name}] Tick failed:`, err instanceof Error ? err.message : err);
      } finally {
        await Bun.sleep(60 * 60 * 1000);
      }
    }
  }

  private async tick() {
    const leaderboard = await this.api.leaderboard(AbortSignal.timeout(5000));

    for (const player of leaderboard) {
      try {
        await this.players.updateByPublicId(player.public_id);
        console.log(`[${this.constructor.name}] Updated stats for player ${player.public_id}`);
      } catch (err) {
        console.error(
          `[${this.constructor.name}] Failed to update stats for player ${player.public_id}:`,
          err instanceof Error ? err.message : err,
        );
      }
      await Bun.sleep(1000);
    }
  }
}
