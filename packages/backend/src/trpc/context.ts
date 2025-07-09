import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { UsersRepository } from '../UsersRepository.ts';
import * as jose from 'jose';
import * as z from 'zod';
import { TokenPayload } from '../Schema/TokenPayload.ts';

export const contextFactory = (secret: Uint8Array, users: UsersRepository) =>
  async function createContext({ req }: CreateNextContextOptions) {
    const jwt: string | undefined = (req.headers.authorization ?? '').split(' ')[1];

    let user: z.infer<typeof TokenPayload> | null = null;
    if (jwt) {
      try {
        const { payload } = await jose.jwtVerify(jwt, secret);
        user = TokenPayload.parse(payload);
      } catch (ignored) {}
    }

    return { user };
  };

export type Context = Awaited<ReturnType<ReturnType<typeof contextFactory>>>;
