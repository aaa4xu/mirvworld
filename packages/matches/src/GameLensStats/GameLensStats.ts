import { PlayerStats } from './PlayerStats';
import type { GamelensEvent } from 'gamelens-events-storage';

export class GameLensStats {
  public readonly players = new Map<number, PlayerStats>();
  private readonly mapping = new Map<number, string>();

  public constructor(events: GamelensEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case 'unit.build': {
          this.player(event.player).addBuild(event.turn, event.unit);
          break;
        }

        case 'attack.terra': {
          this.player(event.player).addTerraAttacks(event.troops);
          break;
        }

        case 'attack.player': {
          this.player(event.player).addAttacksSent(event.target, event.troops);
          this.player(event.target).addAttacksReceived(event.player, event.troops);
          break;
        }

        case 'gold.workers': {
          for (const [id, gold] of Object.entries(event.players)) {
            this.player(parseInt(id)).addGoldFromWorkers(gold);
          }
          break;
        }

        case 'trade.arrived': {
          this.player(event.player).addGoldFromTrade(event.owner, event.gold);
          this.player(event.owner).addGoldFromTrade(event.player, event.gold);
          break;
        }

        case 'trade.captured': {
          this.player(event.player).addGoldFromPiracy(event.owner, event.gold);
          break;
        }

        case 'kill': {
          this.player(event.player).addGoldFromKills(event.turn, event.gold);
          this.player(event.target).killed(event.turn);
          break;
        }

        case 'death': {
          this.player(event.player).killed(event.turn);
          break;
        }

        case 'tiles': {
          console.log(event);
          const total = Object.values(event.players).reduce((a, b) => a + b, 0);
          for (const [id, tiles] of Object.entries(event.players)) {
            this.player(parseInt(id)).addTilesHistory(event.turn, tiles / total);
          }
          break;
        }

        case 'bomb.launched.player': {
          this.player(event.player).addBombSent(event.target, event.type).bombLaunched(event.turn);
          break;
        }

        case 'bomb.launched.terra': {
          this.player(event.player).bombLaunched(event.turn);
          break;
        }

        case 'bomb.landed.player': {
          this.player(event.target).addBombReceived(event.player, event.type);
          break;
        }

        case 'players.mapping': {
          for (const [clientId, info] of Object.entries(event.players)) {
            this.player(info.id).setType(info.type).setTeam(info.team).setName(info.name);
            this.mapping.set(info.id, clientId);
          }
        }
      }
    }
  }

  private player(id: number) {
    if (Number.isNaN(id)) throw new Error(`Invalid player id`);

    if (!this.players.has(id)) {
      this.players.set(id, new PlayerStats());
    }

    return this.players.get(id)!;
  }

  public toJSON() {
    return {
      players: Object.fromEntries(
        this.players
          .entries()
          .filter(([k, v]) => v.getType() === 'HUMAN')
          .map(([k, v]) => [k, v.toJSON()]),
      ),
      mapping: Object.fromEntries(this.mapping.entries()),
    };
  }
}
