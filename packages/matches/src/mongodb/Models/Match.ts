import { ObjectId } from 'mongodb';
import z from 'zod/v4';
import { MatchPlayerSchema } from './MatchPlayer.ts';

export const MatchSchema = z.object({
  _id: z.instanceof(ObjectId),
  gameId: z.string().length(8),
  map: z.string(),
  mode: z.enum(['ffa', 'teams']),
  version: z.string().length(40),
  maxPlayers: z.number().int().min(1),
  players: z.array(MatchPlayerSchema),
  winner: z.string().optional(),
  startedAt: z.date(),
  finishedAt: z.date(),
  createdAt: z.date(),
});

export const MatchInsertSchema = MatchSchema.omit({
  _id: true,
});

export const MatchDTOSchema = MatchSchema.omit({
  _id: true,
}).extend({
  id: z.string(),
});

export type Match = z.infer<typeof MatchSchema>;
export type MatchDTO = z.infer<typeof MatchDTOSchema>;
export type MatchInsert = z.infer<typeof MatchInsertSchema>;
