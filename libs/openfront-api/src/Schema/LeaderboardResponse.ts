import z from 'zod/v4';

export const LeaderboardResponsePlayerSchema = z.object({
  wins: z.int(),
  losses: z.int(),
  total: z.int(),
  public_id: z.string(),
});

export const LeaderboardResponseSchema = z.array(LeaderboardResponsePlayerSchema);

export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
export type LeaderboardResponsePlayer = z.infer<typeof LeaderboardResponsePlayerSchema>;
