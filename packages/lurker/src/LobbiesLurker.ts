import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { GameId } from './OpenFront/GameId.ts';
import { type MatchInfo } from './OpenFront/Schema/MatchInfoSchema.ts';

/**
 * LobbiesLurker monitors the public lobbies from a designated server API at specified intervals
 * and processes them through a download queue. It is designed to be lightweight and to support
 * proper cleanup when no longer needed.
 */
export class LobbiesLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;
  private exponentialBackoffFactor = 0;

  public constructor(
    private readonly api: OpenFrontServerAPI,
    private readonly listener: (id: GameId, time: number, info: MatchInfo) => void,
    private readonly interval = 1_000,
  ) {
    console.log(`[LobbiesLurker] Starting with ${interval}ms interval`);
    this.tick();
  }

  private async tick() {
    const startAt = Date.now();
    try {
      const lobbies = await this.api.publicLobbies(this.abortController.signal);

      const baseTime = Date.now();
      for (const lobby of lobbies) {
        this.listener(new GameId(lobby.gameID), baseTime + (lobby.msUntilStart ?? 0), lobby);
      }
      this.exponentialBackoffFactor = 0;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Http Status=403')) {
        const factor = Math.min(30, Math.pow(2, this.exponentialBackoffFactor));
        console.error(`[LobbiesLurker] ⛔️ Blocked by Cloudflare! Backing off for a ${factor} minutes...`);
        await Bun.sleep(factor * 60 * 1000 + Math.random() * 5000);
        this.exponentialBackoffFactor++;
      } else {
        console.error(`[LobbiesLurker] Error fetching lobbies:`, err);
      }
    } finally {
      if (!this.abortController.signal.aborted) {
        this.timerId = setTimeout(() => this.tick(), Math.max(startAt + this.interval - Date.now(), 250));
      }
    }
  }

  public dispose() {
    console.log(`[LobbiesLurker] Disposing`);
    this.abortController.abort();
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }
}
