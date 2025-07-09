import type { MatchesRepository } from './MatchesRepository.ts';
import type { ReplayStorage } from './ReplayStorage.ts';
import type { OpenFrontWorkerClient } from './OpenFrontWorkerClient.ts';

export class ReplayLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;

  public constructor(
    private readonly client: OpenFrontWorkerClient,
    private readonly storage: ReplayStorage,
    private readonly matches: MatchesRepository,
  ) {
    this.abortController.signal.addEventListener('abort', () => {
      if (this.timerId) {
        clearTimeout(this.timerId);
      }
    });

    this.tick();
  }

  private async tick() {
    this.abortController.signal.throwIfAborted();

    try {
      const match = await this.matches.popQueue();
      if (!match) return;

      const gameRecord = await this.client.archivedGame(match.id);
      if (!gameRecord) return;

      const startAt = performance.now();
      await this.storage.save(match.id, gameRecord);
      await this.matches.markAsImported(match.id);
      console.log(`[ReplayLurker] Saved replay for ${match.id} in ${performance.now() - startAt}ms`);
    } catch (err) {
      console.error(`[ReplayLurker] Error in tick:`, err);
    } finally {
      if (!this.abortController.signal.aborted) {
        this.timerId = setTimeout(() => this.tick(), 6_000);
      }
    }
  }

  public dispose() {
    this.abortController.abort();
  }
}
