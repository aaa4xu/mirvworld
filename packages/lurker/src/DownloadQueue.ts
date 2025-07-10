export class DownloadQueue {
  private state: DownloadQueueEntry[] = [];

  public constructor(restore: ReadonlyArray<DownloadQueueEntry>) {
    for (const entry of restore) {
      this.state.push(entry);
    }
  }

  public push(id: string, startedAt: number) {
    this.state.push({
      id,
      startedAt,
      lastAttemptAt: startedAt,
      attempts: 0,
    });
    return this;
  }

  public pop() {
    const now = Date.now();
    const entry = this.state
      .filter((e) => {
        if (e.startedAt && e.startedAt + 10 * 60 * 1000 > now) {
          return false;
        }

        return e.lastAttemptAt + 60 * 1_000 < now;
      })
      .sort((a, b) => a.lastAttemptAt - b.lastAttemptAt)[0];

    if (entry) {
      entry.attempts++;
      entry.lastAttemptAt = now;
      return entry.id;
    } else {
      return null;
    }
  }

  public remove(id: string) {
    this.state = this.state.filter((e) => e.id !== id);
    return this;
  }

  public toJSON() {
    return this.state;
  }
}

interface DownloadQueueEntry {
  id: string;
  startedAt?: number;
  lastAttemptAt: number;
  attempts: number;
}
