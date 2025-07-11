import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import { DownloadQueue } from './DownloadQueue.ts';

/**
 * LobbiesLurker monitors the public lobbies from a designated server API at specified intervals
 * and processes them through a download queue. It is designed to be lightweight and to support
 * proper cleanup when no longer needed.
 */
export class LobbiesLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;
  private lastTickLobbies: string[] = [];

  public constructor(
    private readonly api: OpenFrontServerAPI,
    private readonly queue: DownloadQueue,
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
        if (this.lastTickLobbies.includes(lobby.gameID)) continue;

        console.log(`[LobbiesLurker] Detected lobby ${lobby.gameID}`);
        await this.queue.push(lobby.gameID, baseTime + (lobby.msUntilStart ?? 0));
      }

      this.lastTickLobbies = lobbies.map((l) => l.gameID);
    } catch (err) {
      console.error(`[LobbiesLurker] Error fetching lobbies:`, err);
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
