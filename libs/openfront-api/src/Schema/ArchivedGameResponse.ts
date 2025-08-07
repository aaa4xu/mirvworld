import z from 'zod';
import { GenericReplaySchema } from 'openfront/src/Schema.ts';

export type ArchivedGameRecord = z.infer<typeof GenericReplaySchema>;

export const ArchivedGameSuccessResponseSchema = z.object({
  success: z.literal(true),
  gameRecord: GenericReplaySchema,
});

export const ArchivedGameErrorResponseSchema = z.object({
  success: z.literal(false),
  exists: z.boolean(),
  error: z.string(),
});

export const ArchivedGameResponseSchema = z.discriminatedUnion('success', [
  ArchivedGameSuccessResponseSchema,
  ArchivedGameErrorResponseSchema,
]);
