import { z } from 'zod/v4';

export const GitCommitSchema = z.string().regex(/^[0-9a-fA-F]{40}$/);

export const ArchivedGameRecordSchema = z.looseObject({
  gitCommit: GitCommitSchema,
});

export type ArchivedGameRecord = z.infer<typeof ArchivedGameRecordSchema>;

export const ArchivedGameSuccessResponseSchema = z.object({
  success: z.literal(true),
  gameRecord: ArchivedGameRecordSchema,
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
