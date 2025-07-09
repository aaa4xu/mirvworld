import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  startedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  lastFetchAt: integer({ mode: 'timestamp_ms' }),
  importedAt: integer({ mode: 'timestamp_ms' }),
});

export const users = sqliteTable('users', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  discordId: text('discordId').notNull().unique(),
  discordAvatar: text('discordAvatar'),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
});
