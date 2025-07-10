import { z } from 'zod';
import { GameEndInfoSchema, GameRecordSchema, PlayerRecordSchema } from 'openfront-client/src/core/Schemas.ts';

export const ArchivedGamePlayerRecordSchema = PlayerRecordSchema.omit({
  persistentID: true,
});

export const ArchivedGameInfoSchema = GameEndInfoSchema.extend({
  players: z.array(ArchivedGamePlayerRecordSchema),
});

export const ArchivedGameRecordSchema = GameRecordSchema.extend({
  info: ArchivedGameInfoSchema,
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
