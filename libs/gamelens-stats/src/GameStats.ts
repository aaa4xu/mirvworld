import z from 'zod';

export const GameStatsSchema = z.object({});

export type GameStats = z.infer<typeof GameStatsSchema>;
