import type { GamelensEvent } from 'gamelens/src/Events.ts';

export class GameLensStats {
  public readonly terraAttacks: Record<string, bigint> = {};
  public readonly playersAttacks: Record<string, Record<string, bigint>> = {};
  public readonly goldWorkers: Record<string, bigint> = {};
  public readonly goldTrade: Record<string, Record<string, bigint>> = {};
  public readonly goldSteal: Record<string, Record<string, bigint>> = {};
  public readonly goldKills: Record<string, bigint> = {};
  public readonly players: Record<string, { id: number; name: string; type: string }> = {};
  public readonly places: number[] = [];
  public readonly tiles: Record<string, Record<string, number>> = {};
  public readonly build: Record<string, [turn: number, unit: string][]> = {};

  public constructor(events: GamelensEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case 'attack.terra': {
          this.increase(this.terraAttacks, event.player, event.troops);
          break;
        }

        case 'attack.player': {
          this.increaseNested(this.playersAttacks, event.player, event.target, event.troops);
          break;
        }

        case 'gold.workers': {
          for (const [playerId, gold] of Object.entries(event.players)) {
            this.increase(this.goldWorkers, parseInt(playerId, 10), gold);
          }
          break;
        }

        case 'trade.arrived': {
          this.increaseNested(this.goldTrade, event.player, event.owner, event.gold);
          this.increaseNested(this.goldTrade, event.owner, event.player, event.gold);
          break;
        }

        case 'trade.captured': {
          this.increaseNested(this.goldSteal, event.player, event.owner, event.gold);
          break;
        }

        case 'players.mapping': {
          for (const [clientId, data] of Object.entries(event.players)) {
            this.players[clientId.toString()] = data;
          }
          break;
        }

        case 'kill': {
          this.places.push(event.target);
          this.increase(this.goldKills, event.player, event.gold);
          break;
        }

        case 'death': {
          this.places.push(event.player);
          break;
        }

        case 'tiles': {
          // this.tiles.set(event.turn, new Map<number, number>());
          this.tiles[event.turn] = {};

          for (const [id, num] of Object.entries(event.players)) {
            this.tiles[event.turn]![id] = num;
          }
          break;
        }

        case 'unit.build': {
          this.build[event.player] ??= [];
          this.build[event.player]!.push([event.turn, event.unit]);
          break;
        }

        // case 'unit.captured': {
        //   this.build[event.player] ??= [];
        //   this.build[event.player]!.push([event.turn, event.unit]);
        //   break;
        // }
      }
    }
  }

  public toJSON() {
    return {
      terraAttacks: this.terraAttacks,
      playersAttacks: this.playersAttacks,
      goldWorkers: this.goldWorkers,
      goldTrade: this.goldTrade,
      goldSteal: this.goldSteal,
      goldKills: this.goldKills,
      players: this.players,
      places: this.places,
      tiles: this.tiles,
      build: this.build,
    };
  }

  private increase(map: Record<string, bigint>, playerId: number, value: bigint) {
    const count = map[playerId.toString()] ?? 0n;
    map[playerId.toString()] = count + value;
  }

  private increaseNested(map: Record<string, Record<string, bigint>>, player1: number, player2: number, value: bigint) {
    if (!(player1.toString() in map)) {
      map[player1.toString()] = {};
    }

    this.increase(map[player1.toString()]!, player2, value);
  }
}
