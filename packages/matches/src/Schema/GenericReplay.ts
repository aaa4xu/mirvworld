import z from 'zod/v4';

export const GenericReplaySchema = z.looseObject({
  gitCommit: z.string(),
});
