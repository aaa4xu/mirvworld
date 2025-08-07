import type { RedisClient } from 'bun';
import z from 'zod';

/**
 * A type‑safe wrapper around a Lua script stored in Redis.
 *
 * The class takes care of:
 *  - validating the `keys` and `args` arrays at runtime using Zod
 *  - loading the script into Redis on first use and caching its SHA‑1 hash
 *  - transparently retrying the call when Redis answers `NOSCRIPT`
 *  - parsing the raw Redis reply through a caller‑supplied Zod schema so that
 *    the returned value is fully type‑checked
 */
export class RedisLuaScript<ResultSchema extends z.ZodTypeAny> {
  private scriptId: Promise<string> | null = null;
  private readonly keysSchema: z.ZodArray<z.ZodString>;
  private readonly argsSchema: z.ZodArray<z.ZodString>;

  public constructor(private readonly options: RedisLuaScriptOptions<ResultSchema>) {
    this.keysSchema = z.array(z.string()).length(this.options.keys);
    this.argsSchema = z.array(z.string()).length(this.options.args);
  }

  public async execute(keys: string[], args: string[]): Promise<z.infer<ResultSchema>> {
    keys = this.keysSchema.parse(keys);
    args = this.argsSchema.parse(args);

    try {
      // Attempt to execute the script using its cached SHA1 hash
      return await this.loadAndExecute(keys, args);
    } catch (err) {
      if (err instanceof Error && err.message.includes('NOSCRIPT')) {
        // If Redis reports the script is not loaded, clear the cached ID and retry
        this.scriptId = null;
        return this.loadAndExecute(keys, args);
      }
      // Re-throw any other errors.
      throw err;
    }
  }

  /**
   * Loads the script if necessary and executes it using EVALSHA.
   * This is the internal execution logic without the retry mechanism.
   */
  private async loadAndExecute(keys: string[], args: string[]): Promise<z.infer<ResultSchema>> {
    const scriptId = await this.getScriptId();
    const result = await this.options.redis.send('EVALSHA', [scriptId, keys.length.toString(), ...keys, ...args]);
    return this.options.schema.parse(result);
  }

  /**
   * Gets the SHA1 hash of the script, loading it into Redis if it hasn't been loaded yet.
   * This method caches the promise for loading the script to prevent multiple SCRIPT LOAD
   * commands from being sent simultaneously
   */
  private getScriptId(): Promise<string> {
    if (!this.scriptId) {
      this.scriptId = this.options.redis.send('SCRIPT', ['LOAD', this.options.source]).then(
        (id) => id,
        (err) => {
          this.scriptId = null;
          throw err;
        },
      );
    }

    return this.scriptId;
  }
}

export interface RedisLuaScriptOptions<ResultSchema extends z.ZodTypeAny> {
  redis: RedisClient;
  source: string;
  keys: number;
  args: number;
  schema: ResultSchema;
}
