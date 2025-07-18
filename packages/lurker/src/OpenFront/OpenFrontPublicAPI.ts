import { OpenFrontClient } from './OpenFrontClient.ts';
import { APIErrorResponseSchema } from './Schema/APIErrorResponse.ts';
import { OpenFrontError } from './Errors/OpenFrontError.ts';
import { PlayerStatsSchema } from './Schema/PlayerStats.ts';
import { ArchivedGameRecordSchema } from './Schema/ArchivedGameResponse.ts';

export class OpenFrontPublicAPI extends OpenFrontClient {
  public async player(id: string, signal?: AbortSignal) {
    const response = await this.request(this.playerUrl(id), signal);

    await this.processError(response);
    this.validateContentType(response, 'application/json');

    const json = await response.json();
    return PlayerStatsSchema.parse(json);
  }

  public async game(id: string, signal?: AbortSignal) {
    const response = await this.request(this.gameUrl(id), signal);

    if (response.status === 404) {
      return null;
    }

    await this.processError(response);
    this.validateContentType(response, 'application/json');

    return ArchivedGameRecordSchema.parse(await response.json());
  }

  private playerUrl(id: string) {
    return this.url(`/player/${id}`);
  }

  private gameUrl(id: string) {
    return this.url(`/game/${id}`);
  }

  private async processError(response: Response) {
    if (response.ok) return;

    try {
      this.validateContentType(response, 'application/json');
      const json = await response.json();
      const error = APIErrorResponseSchema.parse(json);
      throw new OpenFrontError(`${error.error}: ${error.reason ?? `Error code ${error.status}`}`);
    } catch (err) {
      if (err instanceof OpenFrontError) {
        throw err;
      } else {
        throw new Error(`Http Status=${response.status}`);
      }
    }
  }
}
