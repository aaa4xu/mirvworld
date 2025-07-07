import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { matches } from './db/schema.ts';

export class MatchesRepository {
  public constructor(private readonly db: BunSQLiteDatabase) {}

  public async addToQueue(id: string, startedAt: number) {
    await this.db
      .insert(matches)
      .values({
        id,
        startedAt: new Date(startedAt),
      })
      .onConflictDoUpdate({
        target: matches.id,
        set: {
          startedAt: new Date(startedAt),
        },
      });
  }
}
