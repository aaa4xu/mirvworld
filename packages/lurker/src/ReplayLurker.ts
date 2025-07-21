import type { DownloadQueue } from './DownloadQueue/DownloadQueue.ts';
import type { ReplayStorage } from './ReplayStorage.ts';
import type { OpenFrontPublicAPI } from './OpenFront/OpenFrontPublicAPI.ts';
import { cancelableTimeout } from './Utils.ts';
import { OpenFrontError } from './OpenFront/Errors/OpenFrontError.ts';
import type { OpenFrontServerAPI } from './OpenFront/OpenFrontServerAPI.ts';

export class ReplayLurker {
  private readonly abortController = new AbortController();

  public constructor(
    private readonly apiClient: OpenFrontPublicAPI,
    private readonly serverClient: OpenFrontServerAPI,
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
      await this.checkForReplayOnApiServer(id);
    } catch (err) {
      if (err instanceof OpenFrontError && err.message.startsWith('✖')) {
        console.error(`[ReplayLurker][${id}] 💥 API server is not happy with replay:`, err.message);

        try {
          await this.checkForReplayOnWorker(id);
        } catch (err2) {
          console.error(
            `[ReplayLurker][${id}] 💥 Worker also not happy with replay:`,
            err2 instanceof Error ? err2.message : String(err2),
          );
          await this.queue.removeWithError(id, err.message);
        }
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

  private async checkForReplayOnApiServer(id: string) {
    console.log(`[ReplayLurker][${id}] 🕓 Checking replay for game on api server`);

    const gameRecord = await this.apiClient.game(id, this.abortController.signal);

    if (gameRecord) {
      await this.storage.save(id, gameRecord);
      await this.queue.remove(id);
      console.log(`[ReplayLurker][${id}] ✅ Replay for game saved to storage from api`);
      return;
    }

    if ((await this.queue.startedAt(id)) + (3 * 60 + 5) * 60 * 1000 < Date.now()) {
      console.error(`[ReplayLurker][${id}] 🙈 Replay for game is not ready after 3 hours, removing from queue`);
      await this.queue.removeWithError(id, 'Replay is not ready after 3 hours');
    } else {
      console.log(`[ReplayLurker][${id}] 💤 Replay for game is not ready yet`);
    }
  }

  private async checkForReplayOnWorker(id: string) {
    console.log(`[ReplayLurker][${id}] 🕓 Checking replay for game on worker`);
    const res = await this.serverClient.archivedGame(this.serverClient.gameId(id), this.abortController.signal);

    if (!res) {
      throw new Error('Failed to get archived game');
    }

    await this.storage.save(id, res);
    await this.queue.remove(id);
    console.log(`[ReplayLurker][${id}] ✅ Replay for game saved to storage from worker`);
  }
}
