import { RedisClient } from 'bun';
import type { GameId } from './OpenFront/GameId.ts';

export class GameStream {
  public constructor(
    private readonly namespace: string,
    private readonly redis: RedisClient,
  ) {}

  public setExpire(id: GameId | string, ms: number) {
    const seconds = Math.ceil(ms / 1000);
    return this.redis.expire(this.key(id), seconds);
  }

  public push(id: GameId | string, event: string) {
    return this.redis.rpush(this.key(id), event);
  }

  public remove(id: GameId | string) {
    return this.redis.del(this.key(id));
  }

  public get(id: GameId | string): Promise<string[]> {
    return this.redis.send('LRANGE', [this.key(id), '0', '-1']);
  }

  private key(id: GameId | string) {
    return `${this.namespace}:${id}`;
  }
}
