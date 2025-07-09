import { initTRPC } from '@trpc/server';
import type { Context } from './trpc/context.ts';
import { parse, stringify } from 'devalue';

export const transformer = {
  deserialize: (object: any) => parse(object),
  serialize: (object: any) => stringify(object),
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer,
});

export const router = t.router;

export const publicProcedure = t.procedure;
