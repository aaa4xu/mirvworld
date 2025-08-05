// @ts-ignore - lua script
import leakyBucketScript from './LeakyBucket.lua' with { type: 'text' };
import type { RedisClient } from 'bun';
import { LeakyBucketResultSchema } from './Schema.ts';
import { cancelableTimeout } from '../Utils.ts';
import { RedisLuaScript } from '@mirvworld/redis-script';

/**
 * Implements a distributed leaky‐bucket rate limiter backed by Redis.
 *
 * Internally, it uses a Lua script to:
 *  - fetch the current token count and last timestamp from Redis,
 *  - refill tokens based on elapsed server time,
 *  - attempt to consume one token,
 *  - compute a suggested wait time if tokens are not available,
 *  - persist the updated state and appropriate TTL.
 *
 * Usage:
 *  const limiter = new LeakyBucket(options, redisClient);
 *  await limiter.acquire(); // blocks until a token is available
 */
export class LeakyBucket {
  private readonly script: RedisLuaScript<typeof LeakyBucketResultSchema>;

  public constructor(
    private readonly options: RateLimitOptions,
    redis: RedisClient,
    private readonly parent?: LeakyBucket,
  ) {
    if (this.options.refillPerSec <= 0) {
      throw new Error('Refill rate must be positive');
    }

    this.script = new RedisLuaScript({
      redis,
      source: leakyBucketScript,
      keys: 1,
      args: 2,
      schema: LeakyBucketResultSchema,
    });
  }

  /**
   * Acquire one token from the bucket, blocking until successful
   */
  public async acquire(signal?: AbortSignal) {
    while (true) {
      const [allowed, waitMs] = await this.script.execute(
        ['buckets:' + this.options.bucketKey],
        [this.options.refillPerSec.toString(), this.options.capacity.toString()],
      );

      if (allowed === 1) {
        // Token granted
        if (this.parent) {
          await this.parent.acquire(signal);
        }

        return;
      }

      // No token available. Sleep for the suggested delay before retrying
      if (signal) {
        await cancelableTimeout(waitMs, signal);
      } else {
        await Bun.sleep(waitMs);
      }
    }
  }
}

export interface RateLimitOptions {
  /** Redis key that stores the bucket hash */
  bucketKey: string;
  /** Max tokens that can accumulate */
  capacity: number;
  /** How many tokens leak back into the bucket per second */
  refillPerSec: number;
}
