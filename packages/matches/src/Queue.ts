import type { RedisClient } from 'bun';
import { MinioPutEventSchema } from './Schema/MinioPutEvent.ts';

export class Queue {
  private readonly queueKey = 'storage:bucketevents';

  public constructor(private readonly redis: RedisClient) {}

  public async next() {
    const event = await this.redis.lpop(this.queueKey);
    if (!event) return null;

    return MinioPutEventSchema.parse(JSON.parse(event));
  }
}
