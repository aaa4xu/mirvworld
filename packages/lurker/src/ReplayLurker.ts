import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';
import type { DownloadQueue } from './DownloadQueue/DownloadQueue.ts';
import type { ReplayStorage } from './ReplayStorage.ts';
import type { OpenFrontPublicAPI } from './OpenFront/OpenFrontPublicAPI.ts';
import { cancelableTimeout } from './Utils.ts';
import { OpenFrontError } from './OpenFront/Errors/OpenFrontError.ts';

export class ReplayLurker {
  private readonly abortController = new AbortController();

  public constructor(
    private readonly client: OpenFrontPublicAPI,
    private readonly storage: ReplayStorage,
    private readonly queue: DownloadQueue,
  ) {
    this.tick();
  }

  private async tick() {
    this.abortController.signal.throwIfAborted();

    let id: string | null = null;
    try {
      id = await this.queue.pop();
    } catch (e) {
      console.error(`[ReplayLurker] Failed to get id from queue:`, e);
    }

    if (!id) {
      cancelableTimeout(1000, this.abortController.signal)
        .then(() => this.tick())
        .catch(() => null);
      return;
    }

    try {
      console.log(`[ReplayLurker][${id}] 🕓 Checking replay for game`);

      const gameRecord = await this.client.game(id, this.abortController.signal);
      if (!gameRecord) {
        console.log(`[ReplayLurker][${id}] 💤 Replay for game is not ready yet`);
        return;
      }

      await this.storage.save(id, gameRecord);
      await this.queue.remove(id);
      console.log(`[ReplayLurker][${id}] ✅ Replay for game saved to storage`);
    } catch (err) {
      if (err instanceof OpenFrontError && err.message.startsWith('✖')) {
        console.error(`[ReplayLurker][${id}] 💥 Replay is invalid: ${err.message.slice(2)}`);
        await this.queue.removeWithError(id, err.message);
      } else {
        console.error(`[ReplayLurker][${id}] 💥 Failed to check replay:`, err);
      }
    } finally {
      if (!this.abortController.signal.aborted) {
        cancelableTimeout(100, this.abortController.signal)
          .then(() => this.tick())
          .catch(() => null);
      }
    }
  }

  public dispose() {
    console.log(`[ReplayLurker] Disposing`);
    this.abortController.abort();
  }
}
