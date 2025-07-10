import { RedisClient } from 'bun';

export class DownloadQueue {
  private readonly READY_KEY = 'lurker:queue:ready'; // ZSET id → nextEligibleTs
  private readonly ENTRY_PREFIX = 'lurker:queue:entry:'; // HASH per entry

  private static readonly FIRST_DELAY = 10 * 60_000; // 10 mins
  private static readonly RETRY_DELAY = 60 * 1_000; // 1 min

  /**
   * The provided Lua script is designed to perform the following operations:
   * 1. Retrieve the first element from the Redis sorted set with a score
   *    less than or equal to the current time (epoch in milliseconds).
   * 2. If no such element exists, return `nil`.
   * 3. If an element is found:
   *    - Remove the element from the sorted set.
   *    - Update the corresponding hash key with retry attempt details.
   *    - Reschedule the element back to the sorted set with a new score based on the retry delay.
   * 4. Return the ID of the processed element.
   */
  private static readonly POP_LUA = `
    -- KEYS[1] = ready‑sorted‑set
    -- ARGV[1] = now (epoch ms)
    -- ARGV[2] = retryDelay (ms)
    -- ARGV[3] = entryKeyPrefix

    local ready = KEYS[1]
    local now   = tonumber(ARGV[1])
    local retry = tonumber(ARGV[2])
    local prefix= ARGV[3]

    -- Retrieve
    local ids = redis.call('ZRANGEBYSCORE', ready, '-inf', now, 'LIMIT', 0, 1)
    if #ids == 0 then
      return nil
    end

    local id    = ids[1]
    local entry = prefix .. id
    local next  = now + retry

    -- Reschedule
    redis.call('ZREM',  ready, id)
    redis.call('HINCRBY', entry, 'attempts', 1)
    redis.call('HSET',   entry, 'lastAttemptAt', now)
    redis.call('ZADD',   ready, next, id)

    return id
  `;

  public constructor(private readonly redis: RedisClient) {}

  /**
   * Pushes a new entry into the queue and schedules it for execution
   */
  public async push(id: string, startedAt: number) {
    const entryKey = this.key(id);
    const nextTime = startedAt + DownloadQueue.FIRST_DELAY;

    await this.redis.send('MULTI', []);
    await this.redis.send('HMSET', [
      entryKey,
      'id',
      id,
      'startedAt',
      startedAt.toString(),
      'lastAttemptAt',
      '0',
      'attempts',
      '0',
    ]);
    await this.redis.send('ZADD', [this.READY_KEY, nextTime.toString(), id]);
    await this.redis.send('EXEC', []);
  }

  /**
   * Retrieves the next item from the queue if available
   */
  public async pop(): Promise<string | null> {
    const now = Date.now();

    const res = (await this.redis.send('EVAL', [
      DownloadQueue.POP_LUA,
      '1',
      this.READY_KEY,
      now.toString(),
      DownloadQueue.RETRY_DELAY.toString(),
      this.ENTRY_PREFIX,
    ])) as string | null;

    return res ?? null;
  }

  /**
   * Removes an entry from the queue based on the provided identifier
   */
  public async remove(id: string) {
    const entryKey = this.key(id);
    await this.redis.send('MULTI', []);
    await this.redis.send('DEL', [entryKey]);
    await this.redis.send('ZREM', [this.READY_KEY, id]);
    await this.redis.send('EXEC', []);
  }

  private key(id: string) {
    return `${this.ENTRY_PREFIX}${id}`;
  }
}
