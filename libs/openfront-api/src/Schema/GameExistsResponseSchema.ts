import z from 'zod';

export const GameExistsResponseSchema = z.object({
  exists: z.boolean(),
});
