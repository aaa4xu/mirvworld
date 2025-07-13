import { z } from 'zod/v4';

export const GameExistsResponseSchema = z.object({
  exists: z.boolean(),
});
