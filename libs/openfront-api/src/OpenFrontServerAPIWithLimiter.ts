import { OpenFrontServerAPI as BaseOpenFrontServerAPI } from './OpenFrontServerAPI.ts';
import { LeakyBucket } from '@mirvworld/redis-leaky-bucket';

export class OpenFrontServerAPIWithLimiter extends BaseOpenFrontServerAPI {
  public constructor(
    endpoint: string,
    workers: number,
    private readonly limiter: LeakyBucket,
  ) {
    super(endpoint, workers);
  }

  protected override async request(input: URL, signal?: AbortSignal): Promise<Response> {
    await this.limiter.acquire(signal);
    return super.request(input, signal);
  }
}
