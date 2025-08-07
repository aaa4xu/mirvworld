import z from 'zod';
import { GameStatsSchema } from './GameStats.ts';
import { PlayerStatsSchema } from './PlayerStats.ts';

export const GameLensStatsSchema = z.object({
  game: GameStatsSchema,
  players: z.array(PlayerStatsSchema),
});

export type GameLensStats = z.infer<typeof GameLensStatsSchema>;
