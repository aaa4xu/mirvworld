import z from 'zod/v4';

export const PlayerStatsSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string().nullish(),
  firstBuild: z.int(),
  buildOrder: z.string().max(4),
  maxTiles: z.number(),
  tiles: z.number(),
  outgoingTroopsPerMinute: z.number().min(0),
  incomingTroopsPerMinute: z.number().min(0),
  goldPerMinute: z.number().min(0),
  /* Turn of death */
  death: z.int(),
  spawnX: z.int(),
  spawnY: z.int(),
  rank: z.int().min(1),
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
