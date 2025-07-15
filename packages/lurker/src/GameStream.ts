import { RedisClient } from 'bun';
import type { GameId } from './OpenFront/GameId.ts';

export class GameStream {
  public constructor(
    private readonly namespace: string,
    private readonly redis: RedisClient,
  ) {}

  public setExpire(id: GameId | string, ms: number) {
    const seconds = Math.ceil(ms / 1000);
    console.log('set expire', `${this.namespace}:${id}`, seconds);
    return this.redis.expire(`${this.namespace}:${id}`, seconds);
  }

  public push(id: GameId | string, event: string) {
    return this.redis.rpush(`${this.namespace}:${id}`, event);
  }

  public remove(id: GameId | string) {
    return this.redis.del(`${this.namespace}:${id}`);
  }
}
