import z from 'zod/v4';

export const GamelensStatsSchema = z.object({});

export type GamelensStats = z.infer<typeof GamelensStatsSchema>;
