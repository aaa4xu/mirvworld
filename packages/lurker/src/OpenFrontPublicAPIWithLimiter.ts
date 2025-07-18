import { OpenFrontPublicAPI as BaseOpenFrontPublicAPI } from './OpenFront/OpenFrontPublicAPI.ts';
import type { LeakyBucket } from './LeakyBucket/LeakyBucket.ts';

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
