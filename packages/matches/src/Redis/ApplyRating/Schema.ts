import z from 'zod';

export const ApplyRatingResultSchema = z.union([z.tuple([z.literal('SKIP')]), z.array(z.string())]);
