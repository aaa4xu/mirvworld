import z from 'zod';

export const TokenPayloadSchema = z.object({
  scp: z.array(z.string().min(1)),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
