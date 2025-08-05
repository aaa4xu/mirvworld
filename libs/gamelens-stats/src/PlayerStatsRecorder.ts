import { PlayerType } from 'openfront/game/src/core/game/Game.ts';

export class PlayerStatsRecorder {
  public firstBuild = -1;
  public buildOrder = '';
  public death = -1;
  public readonly tiles = new Map<number, number>();
  public spawnX = -1;
  public spawnY = -1;
  public outgoingTroops = 0n;
  public incomingTroops = 0n;
  public goldEarned = 0n;

  public constructor(
    public readonly id: number,
    public readonly clientId: string,
    public readonly name: string,
    public readonly team: string | null,
    public readonly type: PlayerType,
  ) {}

  public increaseGold(gold: bigint) {
    this.goldEarned += gold;
    return this;
  }

  public increaseOutgoingTroops(troops: bigint) {
    this.outgoingTroops += troops;
    return this;
  }

  public increaseIncomingTroops(troops: bigint) {
    this.incomingTroops += troops;
    return this;
  }

  public setSpawn(x: number, y: number) {
    this.spawnX = x;
    this.spawnY = y;
    return this;
  }

  public addBuild(turn: number, build: string) {
    if (this.firstBuild < 0) {
      this.firstBuild = turn;
    }

    if (this.buildOrder.length < 4) {
      this.buildOrder += build.substring(0, 1).toUpperCase();
    }

    return this;
  }

  public killed(turn: number) {
    if (this.death < 0) {
      this.death = turn;
    } else {
      console.error(`[${this.constructor.name}][${this.name}] Killed twice: at turn ${this.death} and ${turn}`);
    }

    return this;
  }

  public territoryHistory(turn: number, tiles: number) {
    this.tiles.set(turn, tiles);
    return this;
  }

  private increase<K>(map: Map<K, number>, key: K, delta: number): this;
  private increase<K>(map: Map<K, bigint>, key: K, delta: bigint): this;
  private increase<K>(map: Map<K, number | bigint>, key: K, delta: number | bigint): this {
    if (typeof delta === 'number') {
      const current = (map.get(key) ?? 0) as number;
      map.set(key, current + delta);
    } else {
      const current = (map.get(key) ?? 0n) as bigint;
      map.set(key, current + delta);
    }

    return this;
  }
}
