import { type ArchivedGameRecord, ArchivedGameResponseSchema } from './Schema/ArchivedGameResponse.ts';
import { LobbiesResponse } from './Schema/LobbiesResponse.ts';

/**
 * Client for interacting with the OpenFront server API
 */
export class OpenFrontServerAPI {
  private readonly userAgent = 'MIRVWorldBot/0.4';
  private readonly acceptEncoding = 'gzip, deflate, br, zstd';

  public constructor(private readonly endpoint: string) {}

  public async publicLobbies(signal?: AbortSignal) {
    const response = await fetch(this.publicLobbiesUrl(), {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': this.acceptEncoding,
      },
      signal: this.withTimeout(signal),
    });

    if (!response.ok) {
      throw new Error(`Http Status=${response.status}`);
    }

    this.validateContentType(response, 'text/html');

    const json = await response.json();
    const result = LobbiesResponse.parse(json);

    return result.lobbies;
  }

  public async archivedGame(id: string, signal?: AbortSignal): Promise<ArchivedGameRecord | null> {
    const response = await fetch(this.replayUrl(id), {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': this.acceptEncoding,
      },
      signal: this.withTimeout(signal),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Http Status=${response.status}`);
    }

    this.validateContentType(response, 'application/json');

    const json = await response.json();
    const result = ArchivedGameResponseSchema.parse(json);

    if (!result.success) {
      throw new Error(`Error fetching archived game ${id}: ${result.error}`);
    }

    return result.gameRecord;
  }

  private validateContentType(response: Response, type: string) {
    const contentType = response.headers.get('Content-Type');
    if (!response.headers.get('Content-Type')?.startsWith(type)) {
      throw new Error(`Invalid content type: expected=${type} actual=${contentType}`);
    }
  }

  private replayUrl(id: string) {
    return this.url(`/w0/api/archived_game/${id}`);
  }

  private publicLobbiesUrl() {
    return this.url('/api/public_lobbies');
  }

  private url(path: string) {
    const url = new URL(this.endpoint);
    url.pathname = path;
    return url;
  }

  private withTimeout(parent?: AbortSignal, timeout = 5000) {
    const timeoutSignal = AbortSignal.timeout(timeout);
    return parent ? AbortSignal.any([parent, timeoutSignal]) : timeoutSignal;
  }
}
