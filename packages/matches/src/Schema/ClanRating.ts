import { z } from 'zod';

const numberFromStrOrNum = (field: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? Number(v) : v),
    z.number().refine(Number.isFinite, { message: `${field} is not a finite number` }),
  );

const nonNegIntFromStrOrNum = (field: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? Number.parseInt(v, 10) : v),
    z.number().refine((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0, {
      message: `${field} is not a valid non-negative int`,
    }),
  );

export const ClanRatingSchema = z.object({
  mu: numberFromStrOrNum('mu'),
  sigma: numberFromStrOrNum('sigma'),
  games: nonNegIntFromStrOrNum('games'),
});

export const ClanRatingDeltaSchema = ClanRatingSchema.extend({
  tag: z.string(),
});

export type ClanRating = z.infer<typeof ClanRatingSchema>;
export type ClanRatingDelta = z.infer<typeof ClanRatingDeltaSchema>;
