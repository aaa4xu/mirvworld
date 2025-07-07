import { LobbiesResponse } from './Schema/LobbiesResponse.ts';
import type { MatchesRepository } from './MatchesRepository.ts';

export class LobbiesLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;
  private readonly url: URL;
  private lastLobbyId = '';

  public constructor(
    endpoint: string,
    private readonly matches: MatchesRepository,
    private readonly interval = 12_000,
  ) {
    this.url = new URL(endpoint);
    this.url.pathname = '/api/public_lobbies';

    this.abortController.signal.addEventListener('abort', () => {
      if (this.timerId) {
        clearTimeout(this.timerId);
      }
    });

    this.tick();
  }

  private async tick() {
    this.abortController.signal.throwIfAborted();
    const startAt = Date.now();
    try {
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'MIRVWorldBot/0.2',
          'Accept-Encoding': 'gzip, deflate',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`[LobbiesLurker] Error fetching lobbies: status=${response.status} ${response.statusText}`);
      }

      const baseTime = Date.now();
      const json = await response.json();
      const lobbies = LobbiesResponse.parse(json);

      for (const lobby of lobbies.lobbies) {
        this.abortController.signal.throwIfAborted();
        await this.matches.addToQueue(lobby.gameID, baseTime + (lobby.msUntilStart ?? 0));

        if (this.lastLobbyId !== lobby.gameID) {
          console.log(`[LobbiesLurker] Detected lobby ${lobby.gameID}`);
          this.lastLobbyId = lobby.gameID;
        }
      }
    } catch (err) {
      console.error(`[LobbiesLurker] Error in tick:`, err);
    } finally {
      if (!this.abortController.signal.aborted) {
        this.timerId = setTimeout(() => this.tick(), startAt + this.interval - Date.now());
      }
    }
  }

  public dispose() {
    console.log(`[LobbiesLurker] Disposing lurker`);
    this.abortController.abort();
  }
}
