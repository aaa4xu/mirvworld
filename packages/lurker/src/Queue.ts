import { RedisClient } from 'bun';
import type { GameId } from './OpenFront/GameId.ts';
// @ts-ignore - this is lua script
import pushScript from './lua/push.lua' with { type: 'text' };
import z from 'zod';
import { RedisLuaScript } from './RedisLuaScript.ts';
import debug from 'debug';

const log = debug('mirvworld:lurker:Queue');

export class Queue {
  private readonly options: Required<QueueOptions>;

  private readonly pushScript: RedisLuaScript<
    typeof PushScriptKeysSchema,
    typeof PushStringArgsSchema,
    typeof PushScriptResultSchema,
    boolean
  >;

  public constructor(
    options: QueueOptions,
    private readonly redis: RedisClient,
  ) {
    this.options = {
      stealIdleMs: 15_000,
      seenTTLms: 3 * 60 * 60 * 1000,
      ...options,
    };

    if (this.options.seenTTLms <= 0) {
      throw new Error('ttl must be positive');
    }

    this.pushScript = new RedisLuaScript({
      redis: this.redis,
      source: pushScript,
      keysSchema: PushScriptKeysSchema,
      argsSchema: PushStringArgsSchema,
      resultSchema: PushScriptResultSchema,
    });
  }

  /**
   * Atomically mark lobby as seen and push to stream.
   * Returns true if lobby was new, false otherwise.
   */
  public async push(id: GameId, startAt: number, info?: Record<string, unknown>): Promise<boolean> {
    log(`push ${id}`);
    return this.pushScript.exec(
      [`${this.options.seenNamespace}:${id}`, this.options.streamKey],
      [this.options.seenTTLms.toString(), id.toString(), startAt.toString(), JSON.stringify(info)],
    );
  }

  /**
   * Fetch next message for a consumer, or steal a stuck one.
   * Returns { id, fields } — либо null, если заданий нет.
   */
  public async fetch(group: string, consumer: string): Promise<{ id: string; fields: Record<string, string> } | null> {
    // steal stuck
    const xacRaw = (await this.redis.send('XAUTOCLAIM', [
      this.options.streamKey,
      group,
      consumer,
      this.options.stealIdleMs.toString(),
      '0-0',
      'COUNT',
      '1',
    ])) as unknown;

    if (xacRaw !== null) {
      const xac = XAutoClaimSchema.safeParse(xacRaw);
      if (xac.success) {
        const [, entries] = xac.data;
        const entry = entries[0];

        if (entry) {
          const [msgId, rawFields] = entry;
          return { id: msgId, fields: this.toObject(rawFields) };
        }
      } else {
        console.warn(`[Queue#${group}] XAUTOCLAIM failed:`, xac.error.format());
      }
    }

    // fresh messages
    const xreadRaw = (await this.redis.send('XREADGROUP', [
      'GROUP',
      group,
      consumer,
      'COUNT',
      '1',
      'STREAMS',
      this.options.streamKey,
      '>',
    ])) as unknown;

    if (xreadRaw !== null) {
      const xread = XReadSchema.safeParse(xreadRaw);
      if (xread.success) {
        let entries: [string, string[]][] = [];

        if (Array.isArray(xread.data)) {
          // RESP2  → [[streamKey, entries]]
          entries = xread.data[0][1];
        } else {
          // RESP3  → {streamKey: entries}
          const firstKey = Object.keys(xread.data)[0]!;
          entries = xread.data[firstKey]!;
        }

        const entry = entries[0];

        if (entry) {
          const [msgId, rawFields] = entry;
          return { id: msgId, fields: this.toObject(rawFields) };
        }
      } else {
        console.warn(`[Queue#${group}] XREADGROUP failed:`, xread.error.format());
      }
    }

    return null;
  }

  public heartbeat(group: string, consumer: string, msgId: string): Promise<void> {
    return this.redis.send('XCLAIM', [this.options.streamKey, group, consumer, '0', msgId, 'JUSTID', 'IDLE', '0']);
  }

  public async ensureGroup(group: string): Promise<void> {
    try {
      await this.redis.send('XGROUP', ['CREATE', this.options.streamKey, group, '$', 'MKSTREAM']);
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes('BUSYGROUP')) throw err;
    }
  }

  public ack(group: string, msgId: string): Promise<void> {
    log(`ack ${group} ${msgId}`);
    return this.redis.send('XACK', [this.options.streamKey, group, msgId]);
  }

  private toObject(arr: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < arr.length; i += 2) {
      obj[arr[i]!] = arr[i + 1]!;
    }

    return obj;
  }
}

export interface QueueOptions {
  /* Redis Stream that stores lobby tasks, e.g. "lobbies:queue" */
  streamKey: string;
  /* Prefix for deduplication keys, e.g. "seen". The real key is `seenNamespace:gameId` */
  seenNamespace: string;
  /* How long (ms) a deduplication flag lives. Default: 3 hours */
  seenTTLms?: number;
  /**
   * A pending message is considered “stuck” and can be
   * claimed via XAUTOCLAIM after it has been idle
   * for at least this many milliseconds.
   */
  stealIdleMs?: number;
}

/** single entry: [ id, [ field, value, … ] ] */
const EntrySchema = z.tuple([z.string(), z.array(z.string())]);
/** RESP2: [ [ streamKey, [ entry, … ] ] ]            */
const XReadArraySchema = z.tuple([z.tuple([z.string(), z.array(EntrySchema)])]);
/** RESP3: { streamKey: [ entry, … ] }                 */
const XReadMapSchema = z.record(z.string(), z.array(EntrySchema));
const XReadSchema = z.union([XReadArraySchema, XReadMapSchema]);

const XAutoClaimSchema = z.union([
  z.tuple([
    z.string(), // next-cursor
    z.array(EntrySchema), // claimed
  ]),
  z.tuple([
    z.string(),
    z.array(EntrySchema),
    z.array(z.string()), // deleted ids
  ]),
]);

const PushScriptKeysSchema = z.tuple([
  // [seenKey, streamKey]
  z.string(),
  z.string(),
]);

const PushStringArgsSchema = z.tuple([
  // [ttl, id, startAt, infoJSON]
  z.string(),
  z.string(),
  z.string(),
  z.string(),
]);

/**  '1' → true, '0' → false  */
const PushScriptResultSchema = z
  .union([z.literal('0'), z.literal('1'), z.literal(1), z.literal(0)])
  .transform((v) => v === '1' || v === 1);
