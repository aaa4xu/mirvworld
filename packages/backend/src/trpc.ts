import { initTRPC } from '@trpc/server';
import type { Context } from './trpc/context.ts';

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;
