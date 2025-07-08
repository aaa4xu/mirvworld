import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { matches } from './db/schema.ts';
import { eq, gt, isNull, lte, or, sql, and, desc, isNotNull } from 'drizzle-orm';
import { config } from '../config.ts';

export class MatchesRepository {
  public constructor(private readonly db: BunSQLiteDatabase) {}

  public latest(limit = 20) {
    return this.db
      .select()
      .from(matches)
      .where(isNotNull(matches.importedAt))
      .orderBy(desc(matches.startedAt))
      .limit(limit);
  }

  public read(id: string) {
    return this.db.select().from(matches).where(eq(matches.id, id));
  }

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

  public async markAsImported(id: string) {
    await this.db.update(matches).set({ importedAt: new Date() }).where(eq(matches.id, id));
  }

  public async popQueue() {
    const now = Date.now();

    // прошло 30 минут
    const thirtyMinutesAgo = new Date(now - 30 * 60 * 1_000);
    const fourHoursAgo = new Date(now - config.maxGameDuration * 1.25);

    const result = await this.db
      .select()
      .from(matches)
      .where(
        and(
          isNull(matches.importedAt), // Данные еще не импортированы
          lte(matches.startedAt, thirtyMinutesAgo), // игра началась ≥ 30 мин назад
          or(isNull(matches.lastFetchAt), lte(matches.lastFetchAt, thirtyMinutesAgo)), // или никогда не проверяли, или проверяли ≥ 30 мин назад
          gt(matches.startedAt, fourHoursAgo), // игра стартовала НЕ более 4 часов назад
        ),
      )
      .orderBy(sql`COALESCE(${matches.lastFetchAt}, 0)`, matches.startedAt)
      .limit(1);

    const match = result.pop();
    if (!match) return null;

    await this.db.update(matches).set({ lastFetchAt: new Date() }).where(eq(matches.id, match.id));

    return match;
  }
}
