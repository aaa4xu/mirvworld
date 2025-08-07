import z from 'zod';

export const LeakyBucketResultSchema = z.tuple([
  z.union([z.literal(0), z.literal(1)]), // 0 | 1  – token granted?
  z.number().int().nonnegative(), // wait-ms (0 when token granted)
]);
