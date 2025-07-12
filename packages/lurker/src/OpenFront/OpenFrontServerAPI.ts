import { ArchivedGameResponseSchema, type ArchivedGameRecord } from './Schema/ArchivedGameResponse.ts';
import { LobbiesResponse } from './Schema/LobbiesResponse.ts';
import { OpenFrontClient } from './OpenFrontClient.ts';

/**
 * Client for interacting with the OpenFront server API
 */
export class OpenFrontServerAPI extends OpenFrontClient {
  public async publicLobbies(signal?: AbortSignal) {
    const response = await this.request(this.publicLobbiesUrl(), signal);

    if (!response.ok) {
      throw new Error(`Http Status=${response.status}`);
    }

    this.validateContentType(response, 'text/html');

    const json = await response.json();
    const result = LobbiesResponse.parse(json);

    return result.lobbies;
  }

  public async archivedGame(id: string, signal?: AbortSignal): Promise<ArchivedGameRecord | null> {
    const response = await this.request(this.replayUrl(id), signal);

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

  private replayUrl(id: string) {
    return this.url(`/w0/api/archived_game/${id}`);
  }

  private publicLobbiesUrl() {
    return this.url('/api/public_lobbies');
  }
}
