import {
  datetime,
  mysqlTable,
  serial,
  varchar,
  tinyint,
  char,
  int,
  mysqlEnum,
  timestamp,
  unique,
  bigint,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const matches = mysqlTable('matches', {
  id: int('id', { unsigned: true }).autoincrement().notNull().primaryKey(),
  gameId: char('game_id', { length: 8 }).notNull().unique(),
  map: varchar({ length: 255 }).notNull(),
  mode: mysqlEnum('mode', ['team', 'ffa']).notNull(),
  version: char({ length: 40 }).notNull(),
  players: tinyint({ unsigned: true }).notNull(),
  maxPlayers: tinyint('max_players', { unsigned: true }).notNull(),
  winner: varchar({ length: 255 }),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const matchPlayers = mysqlTable('match_players', {
  id: serial('id').primaryKey(),
  matchId: int('match_id', { unsigned: true })
    .references(() => matches.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  name: varchar({ length: 255 }).notNull(),
  clientId: char('client_id', { length: 8 }).notNull(),
});

export const matchesRelations = relations(matches, ({ many }) => ({
  players: many(matchPlayers),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
}));
