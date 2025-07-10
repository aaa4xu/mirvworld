import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const matches = sqliteTable(
  'matches',
  {
    id: text('id').primaryKey(),
    startedAt: integer({ mode: 'timestamp_ms' }).notNull(),
    lastFetchAt: integer({ mode: 'timestamp_ms' }),
    importedAt: integer({ mode: 'timestamp_ms' }),
  },
  (table) => [index('startedAt_index').on(table.startedAt)],
);

export const users = sqliteTable('users', {
  id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  discordId: text('discordId').notNull().unique(),
  discordAvatar: text('discordAvatar'),
  createdAt: integer({ mode: 'timestamp_ms' }).notNull(),
});
