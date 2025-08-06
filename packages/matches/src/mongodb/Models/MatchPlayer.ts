import { PlayerStatsSchema } from '@mirvworld/gamelens-stats';
import z from 'zod/v4';
import { ObjectId } from 'mongodb';

export const MatchPlayerInfoSchema = z.object({
  id: z.instanceof(ObjectId),
  name: z.string(),
  avatar: z.string().nullable(),
});

export const MatchPlayerSchema = PlayerStatsSchema.extend({
  info: MatchPlayerInfoSchema.optional(),
});

export type MatchPlayer = z.infer<typeof MatchPlayerSchema>;
export type MatchPlayerInfo = z.infer<typeof MatchPlayerInfoSchema>;
