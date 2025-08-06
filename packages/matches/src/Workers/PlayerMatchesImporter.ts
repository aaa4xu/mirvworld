import type { PlayersService } from '../Services/PlayersService.ts';

export class PlayerMatchesImporter {
  private stopped = false;

  public constructor(private readonly players: PlayersService) {
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
        await Bun.sleep(1000);
      }
    }
  }

  private async tick() {
    const queue = await this.players.updateBatch();

    for (const player of queue) {
      try {
        console.log(`[${this.constructor.name}] Updating stats for player ${player.publicId}`);
        await this.players.updateByPublicId(player.publicId);
      } catch (err) {
        console.error(
          `[${this.constructor.name}] Failed to update stats for player ${player.publicId}`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }
}
