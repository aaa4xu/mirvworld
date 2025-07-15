export class OpenFrontClient {
  public static readonly UserAgent = 'MIRVWorldBot/0.5';
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

  protected request(url: URL, signal?: AbortSignal) {
    return fetch(url, {
      headers: {
        'User-Agent': OpenFrontClient.UserAgent,
        'Accept-Encoding': this.acceptEncoding,
      },
      signal: this.withTimeout(signal),
      // verbose: true,
    });
  }
}
