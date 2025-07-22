import { type matches, matchPlayers } from './db/schema.ts';
import type { GameLensStats } from './GameLensStats/GameLensStats.ts';

export class Match {
  public constructor(
    public readonly info: typeof matches.$inferSelect,
    public readonly players: Array<typeof matchPlayers.$inferSelect>,
    public readonly stats?: GameLensStats,
  ) {}

  public toJSON() {
    return {
      ...this.info,
      players: this.players.map((p) => ({
        name: p.name,
        clientId: p.clientId,
      })),
      stats: this.stats?.toJSON(),
    };
  }
}
