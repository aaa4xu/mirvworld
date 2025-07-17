import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { Redis } from 'ioredis';

let client: Redis | null = null;

/**
 * Returns the singleton Redis client
 */
export function getRedis(): Redis {
	// import.meta.env.BUILD is true only while Vite/Bun is bundling the code
	if (!client && !building) {
		client = env.REDIS_URL ? new Redis(env.REDIS_URL) : new Redis();
	}

	// At runtime client is guaranteed to exist. During build the function is never called.
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return client!;
}
