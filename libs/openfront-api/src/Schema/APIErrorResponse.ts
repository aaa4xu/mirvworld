import z from 'zod/v4';

export const APIErrorResponseSchema = z.object({
  error: z.string(),
  status: z.optional(z.number()),
  reason: z.optional(z.string()),
});
