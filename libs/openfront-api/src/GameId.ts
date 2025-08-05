export class GameId {
  public workerId: string;

  public constructor(
    public readonly id: string,
    workers: number,
  ) {
    this.workerId = `w${this.simpleHash(id) % workers}`;
  }

  public toString() {
    return this.id;
  }

  public toJSON() {
    return this.id.toString();
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
