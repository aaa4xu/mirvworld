import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import superjson from 'superjson';
import type { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import type { ReplayStorage } from 'replay-storage';
import type { MatchesService } from '../Services/MatchesService.ts';
import type { TournamentsService } from '../Services/TournamentsService.ts';
import jwt from 'jsonwebtoken';
import { TokenPayloadSchema } from '../Schema/TokenPayload.ts';
import type { PlayersService } from '../Services/PlayersService.ts';

export const createContext = (
  secret: string,
  api: OpenFrontPublicAPI,
  storage: ReplayStorage,
  matches: MatchesService,
  tournaments: TournamentsService,
  players: PlayersService,
) => {
  return async (opts: CreateHTTPContextOptions) => {
    const authorization = opts.req.headers.authorization?.split(' ');

    let scope: string[] = [];
    if (authorization && authorization[0] === 'Bearer' && authorization[1] && authorization[1].length > 0) {
      try {
        const payload = jwt.verify(authorization[1], secret, {
          algorithms: ['HS256'],
          issuer: 'mirvworld',
        });

        const token = TokenPayloadSchema.parse(payload);
        scope = token.scp;
      } catch (err) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
    }

    return {
      api,
      storage,
      matches,
      tournaments,
      players,
      hasScope: (scp: string) => scope.includes(scp),
    };
  };
};

export type Context = Awaited<ReturnType<ReturnType<typeof createContext>>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.hasScope('admin')) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next();
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(isAdmin);
