import type { RedisClient } from 'bun';
import z from 'zod';

export class RedisLuaScript<
  KeysSchema extends z.ZodTypeAny,
  ArgsSchema extends z.ZodTypeAny,
  ResultSchema extends z.ZodTypeAny,
  Result = z.infer<ResultSchema>,
> {
  private sha: Promise<string> | null = null;

  public constructor(
    private readonly options: {
      redis: RedisClient;
      source: {};
      keysSchema: ZodTuple<ZodString[], null>;
      argsSchema: ZodTuple<ZodString[], null>;
      resultSchema: ZodEffects<ZodUnion<[ZodLiteral<'0'>, ZodLiteral<'1'>]>, boolean>;
    },
  ) {}

  public async exec(
    keys: z.infer<KeysSchema> extends never ? string[] : z.infer<KeysSchema>,
    args: z.infer<ArgsSchema> extends never ? (string | number | boolean)[] : z.infer<ArgsSchema>,
  ): Promise<Result> {
    const ks = (this.options.keysSchema ?? z.array(z.string())).parse(keys);
    const as = (this.options.argsSchema ?? z.array(z.any())).parse(args);

    try {
      return await this.execute(ks, as);
    } catch (err) {
      if (err instanceof Error && err.message.includes('NOSCRIPT')) {
        // скрипт вымылся — сброс кеша и retry
        this.sha = null;
        return this.exec(ks, as);
      }

      throw err;
    }
  }

  private async execute(keys: string[], args: (string | number | boolean)[]): Promise<Result> {
    const sha = await this.load();
    const raw = await this.options.redis.send('EVALSHA', [sha, keys.length.toString(), ...keys, ...args.map(String)]);
    const parsed = this.options.resultSchema.parse(raw);
    return parsed as Result;
  }

  private load(): Promise<string> {
    if (!this.sha) {
      this.sha = this.options.redis.send('SCRIPT', ['LOAD', this.options.source]);
    }
    return this.sha;
  }
}
