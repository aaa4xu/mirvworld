import z from 'zod/v4';

export const DiscordUserInfo = z.object({
  id: z.string(),
  global_name: z.string(),
  avatar: z.string(),
});
