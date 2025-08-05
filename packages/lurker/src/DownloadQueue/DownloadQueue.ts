// @ts-ignore - lua script
import popTaskScript from './PopTask.lua' with { type: 'text' };
import { RedisClient } from 'bun';
import { DownloadQueueResultSchema } from './Schema.ts';
import { type MatchInfo } from '@mirvworld/openfront-api';
import { RedisLuaScript } from '@mirvworld/redis-script';

export class DownloadQueue {
  private readonly script: RedisLuaScript<typeof DownloadQueueResultSchema>;

  public constructor(
    private readonly options: DownloadQueueOptions,
    private readonly redis: RedisClient,
  ) {
    this.script = new RedisLuaScript({
      redis,
      source: popTaskScript,
      schema: DownloadQueueResultSchema,
      keys: 1,
      args: 3,
    });
  }

  /**
   * Pushes a new entry into the queue and schedules it for execution
   */
  public async push(id: string, startedAt: number, info: MatchInfo) {
    const entryKey = this.key(id);
    const nextTime = startedAt + this.options.firstDelay;

    await Promise.all([
      this.redis.send('HMSET', [
        entryKey,
        'id',
        id,
        'startedAt',
        startedAt.toString(),
        'lastAttemptAt',
        '0',
        'attempts',
        '0',
        'info',
        JSON.stringify(info),
      ]),
      this.redis.send('ZADD', [this.options.readyKey, nextTime.toString(), id]),
    ]);
  }

  /**
   * Retrieves the next item from the queue if available
   */
  public async pop(): Promise<string | null> {
    return this.script.execute(
      [this.options.readyKey],
      [Date.now().toString(), this.options.retryDelay.toString(), this.options.entryKeyPrefix],
    );
  }

  /**
   * Removes an entry from the queue based on the provided identifier
   */
  public async remove(id: string) {
    const entryKey = this.key(id);

    return Promise.all([this.redis.send('DEL', [entryKey]), this.redis.send('ZREM', [this.options.readyKey, id])]);
  }

  public async removeWithError(id: string, reason: string) {
    return Promise.all([this.redis.hmset(this.options.deadLetterKey, [id, reason]), this.remove(id)]);
  }

  public async startedAt(id: string) {
    return parseInt((await this.redis.hmget(this.key(id), ['startedAt']))[0] ?? '0', 10);
  }

  private key(id: string) {
    return `${this.options.entryKeyPrefix}${id}`;
  }
}

export interface DownloadQueueOptions {
  firstDelay: number;
  retryDelay: number;
  entryKeyPrefix: string;
  readyKey: string;
  deadLetterKey: string;
}
