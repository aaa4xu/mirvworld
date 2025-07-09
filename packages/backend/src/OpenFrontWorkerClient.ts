import { type ArchivedGameRecord, ArchivedGameResponseSchema } from './Schema/ArchivedGameResponse.ts';

/**
 * Represents a client for interacting with the OpenFront's worker API.
 * This class is responsible for fetching archived game data and constructing
 * appropriate API endpoint URLs based on the provided configurations.
 */
export class OpenFrontWorkerClient {
  private readonly userAgent = 'MIRVWorldBot/0.3';
  private readonly acceptEncoding = 'gzip, deflate, br, zstd';

  public constructor(
    private readonly endpoint: string,
    private readonly index = 0,
  ) {}

  public async archivedGame(id: string): Promise<ArchivedGameRecord | null> {
    const response = await fetch(this.replayUrl(id), {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': this.acceptEncoding,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error fetching archived game ${id}: status=${response.status}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!response.headers.get('Content-Type')?.startsWith('application/json')) {
      throw new Error(`Error fetching archived game ${id}: invalid content type ${contentType}`);
    }

    const json = await response.json();
    const result = ArchivedGameResponseSchema.parse(json);

    if (!result.success) {
      throw new Error(`Error fetching archived game ${id}: ${result.error}`);
    }

    return result.gameRecord;
  }

  private replayUrl(id: string) {
    return this.url(`/api/archived_game/${id}`);
  }

  private url(path: string) {
    const url = new URL(this.endpoint);
    url.pathname = `/w${this.index}/` + (path.startsWith('/') ? path.slice(1) : path);
    return url;
  }
}
