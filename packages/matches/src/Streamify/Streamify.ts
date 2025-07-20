// @ts-ignore - lua script
import moveToStreamScript from './MoveToStream.lua' with { type: 'text' };
import { RedisLuaScript } from 'lurker/src/RedisLuaScript.ts';
import { MoveToStreamResultSchema } from './Schema.ts';
import { RedisClient } from 'bun';

export class Streamify {
  private readonly script: RedisLuaScript<typeof MoveToStreamResultSchema>;
  private stop = false;

  public constructor(
    redis: RedisClient,
    private readonly from: string,
    private readonly to: string,
    private readonly batch = 50,
  ) {
    this.script = new RedisLuaScript({
      redis,
      source: moveToStreamScript,
      keys: 2,
      args: 1,
      schema: MoveToStreamResultSchema,
    });
  }

  public async start() {
    while (!this.stop) {
      try {
        const r = await this.script.execute([this.from, this.to], [this.batch.toString()]);
        console.log(r);
      } catch (err) {
        console.error(`[Streamify][${this.from}/${this.to}] Error:`, err instanceof Error ? err.message : err);
      }

      await Bun.sleep(250);
    }
  }

  dispose() {
    this.stop = true;
  }
}
