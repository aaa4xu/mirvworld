import type { MatchesRepository } from './MatchesRepository.ts';
import type { ReplayStorage } from './ReplayStorage.ts';

export class ReplayLurker {
  private readonly abortController = new AbortController();
  private timerId: NodeJS.Timeout | null = null;

  public constructor(
    private readonly endpoint: string,
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

      const response = await fetch(this.replayUrl(match.id), {
        headers: {
          'User-Agent': 'MIRVWorldBot/0.2',
          'Accept-Encoding': 'gzip',
        },
        signal: AbortSignal.timeout(5000),
        // @ts-expect-error Incorrect typings for bun's fetch
        decompress: false,
      });

      if (response.status !== 200) return; // Match is still in progress

      await this.storage.save(match.id, response);
      await this.matches.markAsImported(match.id);
      console.log(`[ReplayLurker] Saved replay for ${match.id}`);
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

  private replayUrl(gameId: string) {
    const url = new URL(this.endpoint);
    url.pathname = `/w0/api/archived_game/${gameId}`;
    return url;
  }
}
