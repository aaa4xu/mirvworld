import type { MatchesRepository } from './MatchesRepository.ts';
import type { ReplayStorage } from './ReplayStorage.ts';
import { type GameRecord, GameRecordSchema } from 'openfront-client/src/core/Schemas.ts';

export class HistoryImporter {
  public constructor(
    private readonly matches: MatchesRepository,
    private readonly storage: ReplayStorage,
  ) {}

  public async import(queue: string[]) {
    for (const id of queue) {
      const exists = await this.matches.read(id);
      if (exists) continue;

      const startAt = Date.now();
      try {
        const response = await fetch(this.replayUrl(id), {
          headers: {
            'User-Agent': 'MIRVWorldBot/0.2',
            'Accept-Encoding': 'gzip',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) continue;
        const gameRecord = GameRecordSchema.parse(await response.json());

        await this.storage.saveFromGamesApi(id, gameRecord);
        await this.matches.add(id, gameRecord.info.start);
        console.log(`[HistoryImporter] Imported ${id} in ${Date.now() - startAt}ms`);
      } catch (err) {
        console.error(`[HistoryImporter] Error importing ${id}:`, err);
      } finally {
        await Bun.sleep(startAt + 250 - Date.now());
      }
    }

    console.log(`[HistoryImporter] Imported ${queue.length} matches`);
  }

  private replayUrl(gameId: string) {
    return `https://api.openfront.io/game/${gameId}`;
  }
}
