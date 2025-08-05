// @ts-ignore - lua script
import moveToStreamScript from './MoveToStream.lua' with { type: 'text' };
import { MoveToStreamResultSchema } from './Schema.ts';
import { RedisClient } from 'bun';
import { RedisLuaScript } from '@mirvworld/redis-script';

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

    this.start();
  }

  private async start() {
    console.log(`[${this.constructor.name}][${this.from}/${this.to}] Starting`);

    while (!this.stop) {
      try {
        const r = await this.script.execute([this.from, this.to], [this.batch.toString()]);
        if (r.length > 0) {
          console.log(`[${this.constructor.name}][${this.from}/${this.to}] Moved ${r.length} items`);
        } else {
          await Bun.sleep(250);
        }
      } catch (err) {
        console.error(
          `[${this.constructor.name}][${this.from}/${this.to}] Error:`,
          err instanceof Error ? err.message : err,
        );
        await Bun.sleep(250);
      }
    }

    console.log(`[${this.constructor.name}][${this.from}/${this.to}] Stopped`);
  }

  dispose() {
    console.log(`[${this.constructor.name}][${this.from}/${this.to}] Disposing`);
    this.stop = true;
  }
}
