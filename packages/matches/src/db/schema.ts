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

export const openfrontPlayers = mysqlTable('openfront_players', {
  id: int('id', { unsigned: true }).autoincrement().notNull().primaryKey(),
  publicId: char('client_id', { length: 8 }).notNull(),
  registeredAt: timestamp('registered_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const openfrontPlayerMatches = mysqlTable(
  'openfront_player_matches',
  {
    id: serial('id').primaryKey(),
    playerId: int('player_id', { unsigned: true })
      .references(() => openfrontPlayers.id, { onDelete: 'cascade', onUpdate: 'cascade' })
      .notNull(),
    matchId: char('match_id', { length: 8 }).notNull(),
    clientId: char('client_id', { length: 8 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.matchId, t.clientId)],
);

export const matchesRelations = relations(matches, ({ many }) => ({
  players: many(matchPlayers),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
}));

export const openfrontPlayersRelations = relations(openfrontPlayers, ({ many }) => ({
  matches: many(openfrontPlayerMatches),
}));

export const openfrontPlayerMatchesRelations = relations(openfrontPlayerMatches, ({ one }) => ({
  player: one(openfrontPlayers, {
    fields: [openfrontPlayerMatches.playerId],
    references: [openfrontPlayers.id],
  }),
}));
