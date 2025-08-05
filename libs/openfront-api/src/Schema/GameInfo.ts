import z from 'zod/v4';

export const GameInfoResponseSchema = z.looseObject({
  clients: z.array(z.unknown()),
});
