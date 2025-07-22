export class PlayerStats {
  private type = 'BOT';
  private team: string | null = null;
  private name = '';

  private buildHistory = '';
  private terraAttacks = 0n;
  private attacksSent = new Map<number, bigint>();
  private attacksReceived = new Map<number, bigint>();
  private goldFromTrade = new Map<number, bigint>();
  private goldFromWorkers = 0n;
  private goldFromPiracy = new Map<number, bigint>();
  private goldFromKills = 0n;
  private tiles = new Map<number, number>();
  private kills = 0;
  private bombsSent = new Map<number, Map<string, number>>();
  private bombsReceived = new Map<number, Map<string, number>>();

  private firstKillTurn = -1;
  private firstBombLaunched = -1;
  private firstBuild = -1;
  private killedAt = -1;

  public addBuild(turn: number, build: string) {
    if (this.firstBuild < 0) {
      this.firstBuild = turn;
    }
    this.buildHistory += build.slice(0, 1).toUpperCase();
    return this;
  }

  public addTerraAttacks(troops: bigint) {
    this.terraAttacks += troops;
    return this;
  }

  public addAttacksSent(target: number, troops: bigint) {
    this.increase(this.attacksSent, target, troops);
    return this;
  }

  public addAttacksReceived(attacker: number, troops: bigint) {
    this.increase(this.attacksReceived, attacker, troops);
    return this;
  }

  public addGoldFromWorkers(gold: bigint) {
    this.goldFromWorkers += gold;
    return this;
  }

  public addGoldFromTrade(from: number, gold: bigint) {
    this.increase(this.goldFromTrade, from, gold);
    return this;
  }

  public addGoldFromPiracy(from: number, gold: bigint) {
    this.increase(this.goldFromPiracy, from, gold);
    return this;
  }

  public bombLaunched(turn: number) {
    if (this.firstBombLaunched < 0) {
      this.firstBombLaunched = turn;
    }
  }

  public addBombSent(to: number, type: string) {
    if (!this.bombsSent.has(to)) {
      this.bombsSent.set(to, new Map<string, number>());
    }

    this.increase(this.bombsSent.get(to)!, type, 1);
    return this;
  }

  public addBombReceived(from: number, type: string) {
    if (!this.bombsReceived.has(from)) {
      this.bombsReceived.set(from, new Map<string, number>());
    }

    this.increase(this.bombsReceived.get(from)!, type, 1);
    return this;
  }

  public addGoldFromKills(turn: number, gold: bigint) {
    if (this.firstKillTurn < 0) {
      this.firstKillTurn = turn;
    }

    this.kills++;
    this.goldFromKills += gold;
    return this;
  }

  public addTilesHistory(turn: number, tiles: number) {
    this.tiles.set(turn, tiles);
    return this;
  }

  public killed(turn: number) {
    if (this.killedAt < 0) {
      this.killedAt = turn;
    }
    return this;
  }

  private increase<K>(map: Map<K, number>, key: K, delta: number): void;
  private increase<K>(map: Map<K, bigint>, key: K, delta: bigint): void;
  private increase<K>(map: Map<K, number | bigint>, key: K, delta: number | bigint): void {
    if (typeof delta === 'number') {
      const current = (map.get(key) ?? 0) as number;
      map.set(key, current + delta);
    } else {
      const current = (map.get(key) ?? 0n) as bigint;
      map.set(key, current + delta);
    }
  }

  public setType(type: string) {
    this.type = type;
    return this;
  }

  public setTeam(team: string | null) {
    this.team = team;
    return this;
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public getType() {
    return this.type;
  }

  public toJSON() {
    return {
      name: this.name,
      team: this.team,
      type: this.type,
      buildHistory: this.buildHistory,
      terraAttacks: this.terraAttacks,
      attacksSent: Object.fromEntries(this.attacksSent),
      attacksReceived: Object.fromEntries(this.attacksReceived),
      goldFromTrade: Object.fromEntries(this.goldFromTrade),
      goldFromWorkers: this.goldFromWorkers,
      goldFromPiracy: Object.fromEntries(this.goldFromPiracy),
      goldFromKills: this.goldFromKills,
      tiles: Object.fromEntries(this.tiles),
      firstBuild: this.firstBuild,
      killed: this.killedAt,
    };
  }
}
