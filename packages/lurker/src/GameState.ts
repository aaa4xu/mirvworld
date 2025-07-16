import { RedisClient } from 'bun';
import type { GameId } from './OpenFront/GameId.ts';

export class GameState {
  public constructor(
    private readonly namespace: string,
    private readonly redis: RedisClient,
  ) {}

  public setExpire(id: GameId | string, ms: number) {
    const seconds = Math.ceil(ms / 1000);
    return Promise.all([
      this.redis.expire(this.key(id, 'turns'), seconds),
      this.redis.expire(this.key(id, 'info'), seconds),
    ]);
  }

  public async setInfo(id: GameId | string, info: string) {
    return this.redis.set(this.key(id, 'info'), info);
  }

  public addTurn(id: GameId | string, event: string) {
    return this.redis.rpush(this.key(id, 'turns'), event);
  }

  public remove(id: GameId | string) {
    return Promise.all([this.removeTurns(id), this.redis.del(this.key(id, 'info'))]);
  }

  public removeTurns(id: GameId | string) {
    return this.redis.del(this.key(id, 'turns'));
  }

  public turns(id: GameId | string): Promise<string[]> {
    return this.redis.send('LRANGE', [this.key(id, 'turns'), '0', '-1']);
  }

  private key(id: GameId | string, suffix: string) {
    return `${this.namespace}:${id}:${suffix}`;
  }
}
