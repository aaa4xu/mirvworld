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
      lastAttemptAt: startedAt,
      attempts: 0,
    });
    return this;
  }

  public pop() {
    const entry = this.state
      .filter((e) => e.lastAttemptAt + 60 * 1_000 < Date.now())
      .sort((a, b) => a.lastAttemptAt - b.lastAttemptAt)[0];

    if (entry) {
      entry.attempts++;
      entry.lastAttemptAt = Date.now();
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
  lastAttemptAt: number;
  attempts: number;
}
