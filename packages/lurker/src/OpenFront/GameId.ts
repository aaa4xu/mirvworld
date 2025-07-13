import { config } from '../../config.ts';

export class GameId {
  public workerId: string;

  public constructor(
    public readonly id: string,
    workers = config.openfront.workers,
  ) {
    this.workerId = `w${this.simpleHash(id) % workers}`;
  }

  public toString() {
    return this.id;
  }

  private simpleHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
