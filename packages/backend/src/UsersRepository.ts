import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { users } from './db/schema';

export class UsersRepository {
  public constructor(private readonly db: BunSQLiteDatabase) {}

  public discordLogin(id: string, name: string, avatar: string) {
    return this.db
      .insert(users)
      .values({
        name,
        discordId: id,
        discordAvatar: avatar,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.discordId,
        set: {
          name,
          discordAvatar: avatar,
        },
      })
      .returning()
      .then((r) => r[0]!);
  }
}
