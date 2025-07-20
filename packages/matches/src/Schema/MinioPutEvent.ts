import z from 'zod/v4';

export const MinioPutEventSchema = z.array(
  z.object({
    Event: z.array(
      z.object({
        eventName: z.string(),
        s3: z.object({
          bucket: z.object({
            name: z.string(),
          }),
          object: z.object({
            key: z.string(),
          }),
        }),
      }),
    ),
  }),
);
