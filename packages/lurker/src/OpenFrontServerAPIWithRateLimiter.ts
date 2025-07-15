import z from 'zod';
import { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { RedisLuaScript } from './RedisLuaScript.ts';
import { RedisClient } from 'bun';

// @ts-ignore - lua script
import leakyBucketScript from './lua/leaky_bucket.lua' with { type: 'text' };
import { cancelableTimeout } from './Utils.ts';

export class OpenFrontServerAPIWithRateLimiter extends OpenFrontServerAPI {
  private readonly bucketScript: RedisLuaScript<
    typeof LeakyBucketKeysSchema,
    typeof LeakyBucketArgsSchema,
    typeof LeakyBucketResultSchema,
    [number, number]
  >;

  private readonly bucketKey: string;
  private readonly capacity: number;
  private readonly refillPerSec: number;

  public constructor(
    endpoint: string,
    redis: RedisClient,
    { bucketKey = 'openfront:server:rate', capacity = 4, refillPerSec = 4 }: RateLimitOptions = {},
  ) {
    super(endpoint);

    this.bucketKey = bucketKey;
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;

    // Prepare the script wrapper
    this.bucketScript = new RedisLuaScript({
      redis,
      source: leakyBucketScript,
      keysSchema: LeakyBucketKeysSchema,
      argsSchema: LeakyBucketArgsSchema,
      resultSchema: LeakyBucketResultSchema,
    });
  }

  /* ────────────── acquisition helper ────────────── */
  private async acquireToken(signal?: AbortSignal): Promise<void> {
    while (true) {
      const [allowed, waitMs] = await this.bucketScript.exec([this.bucketKey], [this.refillPerSec, this.capacity]);

      if (allowed === 1) return; // success – go ahead

      // no tokens – sleep the suggested time and retry
      if (signal) {
        await cancelableTimeout(waitMs, signal);
      } else {
        await Bun.sleep(waitMs);
      }
    }
  }

  protected override async request(input: URL, signal?: AbortSignal): Promise<Response> {
    await this.acquireToken(signal);
    return super.request(input, signal);
  }
}

export interface RateLimitOptions {
  /** Redis key that stores the bucket hash */
  bucketKey?: string;
  /** Max tokens that can accumulate */
  capacity?: number;
  /** How many tokens leak back into the bucket per second */
  refillPerSec?: number;
}

export const LeakyBucketKeysSchema = z.tuple([
  z.string(), // KEYS[1] bucket hash key
]);

export const LeakyBucketArgsSchema = z.tuple([
  z.number().positive(), // ARGV[1] refill rate, tokens / second
  z.number().positive(), // ARGV[2] capacity
]);

export const LeakyBucketResultSchema = z.tuple([
  z.union([z.literal(0), z.literal(1)]), // 0 | 1  – token granted?
  z.number().int().nonnegative(), // wait-ms (0 when token granted)
]);
