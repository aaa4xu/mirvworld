import z from 'zod';
import { ObjectId } from 'mongodb';

export const TournamentMaxTilesScoringRuleSchema = z.object({
  id: z.literal('max-tiles'),
  params: z
    .array(z.number())
    .min(1, 'Max tiles scoring rule should have points for at least one placement')
    .refine((arr) => arr.every((v, i) => i === 0 || v <= arr[i - 1]!), 'Points must be non-increasing'),
});

export const TournamentSchema = z.object({
  _id: z.instanceof(ObjectId),
  slug: z.string(),
  name: z.string(),
  matches: z.array(z.instanceof(ObjectId)),
  rules: z.discriminatedUnion('id', [TournamentMaxTilesScoringRuleSchema]),
  mode: z.enum(['ffa', 'teams']),
  startAt: z.date(),
  endAt: z.date(),
  createdAt: z.date(),
  finishedAt: z.date().nullable(),
  aliases: z.record(z.string(), z.string()).default({}),
  community: z.record(z.string(), z.string()).default({}),
});

export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentMaxTilesScoringRule = z.infer<typeof TournamentMaxTilesScoringRuleSchema>;
