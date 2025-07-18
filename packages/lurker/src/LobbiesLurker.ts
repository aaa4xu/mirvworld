import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { type MatchInfo } from './OpenFront/Schema/MatchInfoSchema.ts';
import { cancelableTimeout } from './Utils.ts';

/**
 * LobbiesLurker monitors the public lobbies from a designated server API at specified intervals
 * and processes them through a download queue. It is designed to be lightweight and to support
 * proper cleanup when no longer needed.
 */
export class LobbiesLurker {
  private readonly abortController = new AbortController();
  private exponentialBackoffFactor = 0;

  public constructor(
    private readonly server: OpenFrontServerAPI,
    private readonly listener: (lobbies: MatchInfo[]) => void,
    private readonly interval = 1_000,
  ) {
    console.log(`[LobbiesLurker] Starting with ${interval}ms interval`);
    this.tick();
  }

  private async tick() {
    const startAt = Date.now();
    try {
      const lobbies = await this.server.publicLobbies(this.abortController.signal);
      this.listener(lobbies);
      this.exponentialBackoffFactor = 0;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Http Status=403')) {
        const factor = Math.min(60, Math.pow(2, this.exponentialBackoffFactor));
        console.error(`[LobbiesLurker] ⛔️ Blocked! Backing off for a ${factor} minutes...`);
        await Bun.sleep(factor * 60 * 1000 + Math.random() * 5000);
        this.exponentialBackoffFactor++;
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn(`[LobbiesLurker] Fetching lobbies aborted`);
      } else {
        console.error(`[LobbiesLurker] Error fetching lobbies:`, err);
      }
    } finally {
      if (!this.abortController.signal.aborted) {
        cancelableTimeout(Math.max(1, startAt + 1000 - Date.now()), this.abortController.signal)
          .then(() => this.tick())
          .catch(() => null);
      }
    }
  }

  public dispose() {
    console.log(`[LobbiesLurker] Disposing`);
    this.abortController.abort();
  }
}
