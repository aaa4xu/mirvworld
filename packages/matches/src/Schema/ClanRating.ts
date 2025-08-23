import { z } from 'zod';

export const ClanRatingSchema = z.object({
  mu: z.string().transform((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('mu is not a finite number');
    return n;
  }),
  sigma: z.string().transform((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('sigma is not a finite number');
    return n;
  }),
  games: z.string().transform((v) => {
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0) throw new Error('games is not a valid non-negative int');
    return n;
  }),
});

export const ClanRatingDeltaSchema = ClanRatingSchema.extend({
  tag: z.string(),
});

export type ClanRating = z.infer<typeof ClanRatingSchema>;
export type ClanRatingDelta = z.infer<typeof ClanRatingDeltaSchema>;
