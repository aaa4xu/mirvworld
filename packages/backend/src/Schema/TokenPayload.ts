import { z } from 'zod';

export const TokenPayload = z.object({
  id: z.number(),
  name: z.string(),
  avatar: z.string(),
});
