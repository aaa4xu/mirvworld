import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import type { DownloadQueue } from './DownloadQueue.ts';
import type { ReplayStorage } from './ReplayStorage.ts';

export class ReplayLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;

  public constructor(
    private readonly client: OpenFrontServerAPI,
    private readonly storage: ReplayStorage,
    private readonly queue: DownloadQueue,
  ) {
    this.tick();
  }

  private async tick() {
    this.abortController.signal.throwIfAborted();

    try {
      const id = await this.queue.pop();
      if (!id) return;

      const gameRecord = await this.client.archivedGame(id);
      if (!gameRecord) return;

      const startAt = performance.now();
      await this.storage.save(id, gameRecord);
      await this.queue.remove(id);
      console.log(`[ReplayLurker] Saved replay for ${id} in ${performance.now() - startAt}ms`);
    } catch (err) {
      console.error(`[ReplayLurker] Failed to download replay:`, err);
    } finally {
      if (!this.abortController.signal.aborted) {
        this.timerId = setTimeout(() => this.tick(), 1_000);
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
