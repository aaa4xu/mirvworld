import { OpenFrontServerAPI as BaseOpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import type { LeakyBucket } from './LeakyBucket/LeakyBucket.ts';

export class OpenFrontServerAPIWithLimiter extends BaseOpenFrontServerAPI {
  public constructor(
    endpoint: string,
    private readonly limiter: LeakyBucket,
  ) {
    super(endpoint);
  }

  protected override async request(input: URL, signal?: AbortSignal): Promise<Response> {
    await this.limiter.acquire(signal);
    return super.request(input, signal);
  }
}
