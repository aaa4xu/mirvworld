import { ArchivedGameResponseSchema, type ArchivedGameRecord } from './Schema/ArchivedGameResponse.ts';
import { LobbiesResponse } from './Schema/LobbiesResponse.ts';
import { OpenFrontClient } from './OpenFrontClient.ts';
import type { GameId } from './GameId.ts';
import { GameExistsResponseSchema } from './Schema/GameExistsResponseSchema.ts';

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

  public async archivedGame(id: GameId, signal?: AbortSignal): Promise<ArchivedGameRecord | null> {
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

  public async gameExists(id: GameId, signal?: AbortSignal): Promise<boolean> {
    const response = await this.request(this.gameExistsUrl(id), signal);

    if (!response.ok) {
      throw new Error(`Http Status=${response.status}`);
    }

    this.validateContentType(response, 'application/json');

    const json = await response.json();
    const result = GameExistsResponseSchema.parse(json);

    return result.exists;
  }

  private replayUrl(id: GameId) {
    return this.url(`/${id.workerId}/api/archived_game/${id}`);
  }

  private publicLobbiesUrl() {
    return this.url('/api/public_lobbies');
  }

  private gameExistsUrl(id: GameId) {
    return this.url(`/${id.workerId}/api/game/${id}/exists`);
  }
}
