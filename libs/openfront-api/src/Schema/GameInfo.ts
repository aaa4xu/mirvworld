import z from 'zod';

export const GameInfoResponseSchema = z.looseObject({
  clients: z.array(z.unknown()),
});
