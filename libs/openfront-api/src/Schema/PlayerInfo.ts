import z from 'zod/v4';

export const PlayerInfoSchema = z.object({
  user: z
    .object({
      id: z.string().nullable().optional(),
      username: z.string().nullable().optional(),
      global_name: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
    })
    .optional(),
  createdAt: z.string(),
  games: z.array(
    z.object({
      gameId: z.string(),
      clientId: z.string(),
    }),
  ),
});

export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;
