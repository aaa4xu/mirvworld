import z from 'zod/v4';

export const GameStatsSchema = z.object({});

export type GameStats = z.infer<typeof GameStatsSchema>;
