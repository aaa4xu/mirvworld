import type { OpenFrontPublicAPI } from './OpenFront/OpenFrontPublicAPI.ts';
import type { ReplayStorage } from './ReplayStorage.ts';

export class HistoryImporter {
  public constructor(
    private readonly client: OpenFrontPublicAPI,
    private readonly storage: ReplayStorage,
  ) {}

  public async process(matches: string[], signal?: AbortSignal) {
    for (const id of matches) {
      const startAt = Date.now();
      try {
        const replay = await this.client.game(id, signal);
        await this.storage.save(id, replay);
        console.log(`[HistoryImporter] Imported ${id} in ${Date.now() - startAt}ms`);
      } catch (err) {
        console.error(`[HistoryImporter] Error importing ${id}:`, err instanceof Error ? err.message : err);
      }
      if (signal?.aborted) return;
    }
  }
}
