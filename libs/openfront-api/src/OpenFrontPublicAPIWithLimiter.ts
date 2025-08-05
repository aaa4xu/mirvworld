import { OpenFrontPublicAPI as BaseOpenFrontPublicAPI } from './OpenFrontPublicAPI.ts';
import { LeakyBucket } from '@mirvworld/redis-leaky-bucket';

export class OpenFrontPublicAPIWithLimiter extends BaseOpenFrontPublicAPI {
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
