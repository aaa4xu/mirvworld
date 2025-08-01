import type { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema.ts';
import { desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { OpenFrontPublicAPI } from 'lurker/src/OpenFront/OpenFrontPublicAPI';

export class PlayerMatchesImporter {
  public constructor(
    private readonly db: MySql2Database<typeof schema>,
    private readonly api: OpenFrontPublicAPI,
  ) {
    this.start();
  }

  public async start() {
    console.log('[PlayerMatchesImporter] Started');

    while (true) {
      try {
        await this.tick();
      } catch (err) {
        console.log('Tick failed:', err instanceof Error ? err.message : err);
      } finally {
        await Bun.sleep(1000);
      }
    }
  }

  private async tick() {
    const queue = await this.db
      .select()
      .from(schema.openfrontPlayers)
      .where(lt(schema.openfrontPlayers.updatedAt, new Date(Date.now() - 5 * 60 * 1000)))
      .orderBy(desc(schema.openfrontPlayers.updatedAt))
      .limit(10);

    for (const player of queue) {
      try {
        const stats = await this.api.player(player.publicId);
        await this.db
          .insert(schema.openfrontPlayerMatches)
          .values(
            stats.games.map((game) => ({
              playerId: player.id,
              matchId: game.gameId,
              clientId: game.clientId,
            })),
          )
          .onDuplicateKeyUpdate({ set: { id: sql`id` } }); // no-op @see https://orm.drizzle.team/docs/insert#on-duplicate-key-update
      } catch (err) {
        console.error(`Failed to update stats for player ${player.id}`, err instanceof Error ? err.message : err);
      }
    }

    await this.db
      .update(schema.openfrontPlayers)
      .set({
        updatedAt: new Date(),
      })
      .where(
        inArray(
          schema.openfrontPlayers.id,
          queue.map((q) => q.id),
        ),
      );
  }
}
