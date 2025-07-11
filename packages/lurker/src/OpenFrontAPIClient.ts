export class OpenFrontAPIClient {
  protected readonly userAgent = 'MIRVWorldBot/0.4';
  protected readonly acceptEncoding = 'gzip, deflate, br, zstd';

  public constructor(protected readonly endpoint: string) {}

  protected url(path: string) {
    const url = new URL(this.endpoint);
    url.pathname = path;
    return url;
  }

  protected withTimeout(parent?: AbortSignal, timeout = 5000) {
    const timeoutSignal = AbortSignal.timeout(timeout);
    return parent ? AbortSignal.any([parent, timeoutSignal]) : timeoutSignal;
  }

  protected validateContentType(response: Response, type: string) {
    const contentType = response.headers.get('Content-Type');
    if (!response.headers.get('Content-Type')?.startsWith(type)) {
      throw new Error(`Invalid content type: expected=${type} actual=${contentType}`);
    }
  }
}
