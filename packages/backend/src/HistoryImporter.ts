import type { MatchesRepository } from './MatchesRepository.ts';
import type { ReplayStorage } from './ReplayStorage.ts';
import type { OpenFrontWorkerClient } from './OpenFrontWorkerClient.ts';

export class HistoryImporter {
  public constructor(
    private readonly client: OpenFrontWorkerClient,
    private readonly matches: MatchesRepository,
    private readonly storage: ReplayStorage,
  ) {}

  public async import(queue: string[]) {
    for (const id of queue) {
      const startAt = Date.now();
      try {
        const gameRecord = await this.client.archivedGame(id);
        if (!gameRecord) continue;

        await this.storage.save(id, gameRecord);
        await this.matches.add(id, gameRecord.info.start);
        console.log(`[HistoryImporter] Imported ${id} in ${Date.now() - startAt}ms`);
      } catch (err) {
        console.error(`[HistoryImporter] Error importing ${id}:`, err instanceof Error ? err.message : err);
      } finally {
        await Bun.sleep(startAt + 250 - Date.now());
      }
    }

    console.log(`[HistoryImporter] Imported ${queue.length} matches`);
  }
}
