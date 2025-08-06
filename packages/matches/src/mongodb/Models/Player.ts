import z from 'zod/v4';
import { ObjectId } from 'mongodb';

export const PlayerSchema = z.object({
  _id: z.instanceof(ObjectId),
  publicId: z.string(),
  avatar: z.string().nullable(),
  name: z.string(),
  registeredAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Player = z.infer<typeof PlayerSchema>;
