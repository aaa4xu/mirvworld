import { type Game, type Player, PlayerType, type TerraNullius } from 'openfront/game/src/core/game/Game';
import type { Stats as GameStats } from 'openfront/game/src/core/game/Stats';
import type { NukeType, OtherUnitType } from 'openfront/game/src/core/StatsSchemas';
import { type GamelensEvent } from './Events.ts';
import z from 'zod/v4';
import type { TurnSchema } from 'openfront/game/src/core/Schemas.ts';

export class Stats implements GameStats {
  private turn = 0;
  private events: GamelensEvent[] = [];
  private captureNewOwner: number | null = null;
  private destroyer: number | null = null;
  private dead = new Set<number>();
  private spawns: Record<string, [x: number, y: number]> = {};
  private goldFromWorkers = new Map<number, bigint>();

  public getEvents() {
    return this.events;
  }

  public startTurn(turn: z.infer<typeof TurnSchema>, game: Game) {
    this.turn = turn.turnNumber;

    if (this.captureNewOwner !== null) {
      throw new Error('Capture new owner is not null');
    }

    if (this.destroyer !== null) {
      throw new Error('Destroyer is not null');
    }

    for (const intent of turn.intents) {
      if (game.inSpawnPhase() && intent.type === 'spawn') {
        const player = game.playerByClientID(intent.clientID);
        if (!player) {
          console.error('Player not found', intent.clientID);
          continue;
        }

        this.events.push({
          type: 'spawn',
          turn: this.turn,
          player: player.smallID(),
          x: game.x(intent.tile),
          y: game.y(intent.tile),
        });
      }
    }

    if (!game.inSpawnPhase() && this.turn % 150 === 0) {
      // 150 turns = 15sec
      this.addGoldFromWorkersEvent();
      this.addTilesEvent(game);
    }
  }

  public endTurn(game: Game) {
    if (!game.inSpawnPhase()) {
      for (const player of game.allPlayers()) {
        if (!player.isAlive() && !this.dead.has(player.smallID())) {
          this.deathBySnuSnu(player);
        }
      }
    }
  }

  public startGame(game: Game) {}

  public endGame(game: Game) {
    this.addGoldFromWorkersEvent();
    this.addTilesEvent(game);
    this.addPlayersMappingEvent(game);
  }

  public attack(player: Player, target: Player | TerraNullius, troops: number | bigint): void {
    troops = this.toBigInt(troops);

    if (target.isPlayer()) {
      this.events.push({
        type: 'attack.player',
        turn: this.turn,
        player: player.smallID(),
        target: target.smallID(),
        troops: BigInt(troops),
      });
    } else {
      this.events.push({
        type: 'attack.terra',
        turn: this.turn,
        player: player.smallID(),
        troops: BigInt(troops),
      });
    }
  }

  public attackCancel(player: Player, target: Player | TerraNullius, troops: number | bigint): void {}

  public betray(player: Player): void {
    // v0.24.0: А где второй игрок???
  }

  public boatArriveTrade(player: Player, target: Player, gold: number | bigint): void {
    // v0.24.0: нигде не вызывается, добавил через патчи
    // Торговец player прибыл в порт target
    this.events.push({
      type: 'trade.arrived',
      turn: this.turn,
      player: target.smallID(),
      owner: player.smallID(),
      gold: this.toBigInt(gold),
    });
  }

  public boatArriveTroops(player: Player, target: Player | TerraNullius, troops: number | bigint): void {
    // v0.24.0: Бесполезное событие, так как вызывается даже тогда,
    // когда лодка приплыла на свой собственный или дружественный берег
  }

  public boatCapturedTrade(player: Player, target: Player, gold: number | bigint): void {
    // v0.24.0: нигде не вызывается, добавил через патчи
    // Захваченный торговец target прибыл в порт player
    this.events.push({
      type: 'trade.captured',
      turn: this.turn,
      player: player.smallID(),
      owner: target.smallID(),
      gold: this.toBigInt(gold),
    });
  }

  public boatDestroyTrade(player: Player, target: Player): void {
    this.events.push({
      type: 'trade.destroyed',
      turn: this.turn,
      player: player.smallID(),
      owner: target.smallID(),
    });
  }

  public boatDestroyTroops(player: Player, target: Player, troops: number | bigint): void {}

  public boatSendTrade(player: Player, target: Player): void {}

  public boatSendTroops(player: Player, target: Player | TerraNullius, troops: number | bigint): void {}

  public bombIntercept(player: Player, type: NukeType, count: number | bigint): void {}

  public bombLand(player: Player, target: Player | TerraNullius, type: NukeType): void {
    this.events.push({
      type: 'bomb.landed',
      turn: this.turn,
      player: player.smallID(),
      target: target.smallID(),
      nukeType: type,
    });
  }

  public bombLaunch(player: Player, target: Player | TerraNullius, type: NukeType): void {}

  public goldWar(player: Player, captured: Player, gold: number | bigint): void {
    // v0.24.0: Трекает только убийства через аннексии, запатчил чтобы трекало и обычные убийства
    this.events.push({
      type: 'kill',
      turn: this.turn,
      player: player.smallID(),
      target: captured.smallID(),
      gold: this.toBigInt(gold),
    });
    this.dead.add(captured.smallID());
  }

  public goldWork(player: Player, gold: number | bigint): void {
    gold = this.toBigInt(gold);
    const value = this.goldFromWorkers.get(player.smallID()) ?? 0n;
    this.goldFromWorkers.set(player.smallID(), value + gold);
  }

  public unitBuild(player: Player, type: OtherUnitType): void {
    this.events.push({
      type: 'unit.build',
      turn: this.turn,
      player: player.smallID(),
      unit: type,
    });
  }

  public unitCapture(player: Player, type: OtherUnitType): void {
    if (this.captureNewOwner !== null) {
      throw new Error('Already capturing');
    }

    this.captureNewOwner = player.smallID();
  }

  public unitDestroy(player: Player, type: OtherUnitType): void {
    if (this.destroyer !== null) {
      throw new Error('Already destroying');
    }

    this.destroyer = player.smallID();
  }

  public unitLose(player: Player, type: OtherUnitType): void {
    if (this.captureNewOwner !== null) {
      this.events.push({
        type: 'unit.captured',
        turn: this.turn,
        player: this.captureNewOwner,
        from: player.smallID(),
        unit: type,
      });
      this.captureNewOwner = null;
    } else if (this.destroyer !== null) {
      this.events.push({
        type: 'unit.destroyed',
        turn: this.turn,
        player: this.destroyer,
        from: player.smallID(),
        unit: type,
      });
      this.destroyer = null;
    } else {
      throw new Error('Unit destroyed by unknown action');
    }
  }

  public unitUpgrade(player: Player, type: OtherUnitType): void {
    this.events.push({
      type: 'unit.build',
      turn: this.turn,
      player: player.smallID(),
      unit: type,
    });
  }

  private deathBySnuSnu(player: Player) {
    console.error('Death by SnuSnu', player.smallID(), player.name());
    this.events.push({
      type: 'death',
      turn: this.turn,
      player: player.smallID(),
    });
    this.dead.add(player.smallID());
  }

  private addTilesEvent(game: Game) {
    const tiles = game.players().reduce(
      (acc, p) => {
        acc[p.smallID()] = p.numTilesOwned();
        return acc;
      },
      {} as Record<number, number>,
    );

    this.events.push({
      type: 'tiles',
      turn: this.turn,
      players: tiles,
    });
  }

  private addGoldFromWorkersEvent() {
    this.events.push({
      type: 'gold.workers',
      turn: this.turn,
      players: Object.fromEntries(this.goldFromWorkers.entries()),
    });
    this.goldFromWorkers.clear();
  }

  private addPlayersMappingEvent(game: Game) {
    const players = game.allPlayers().reduce(
      (acc, p) => {
        const clientId = p.clientID();
        if (!clientId) return acc;
        acc[clientId] = { id: p.smallID(), name: p.displayName(), type: p.type() };
        return acc;
      },
      {} as Record<string, { id: number; name: string; type: string }>,
    );

    this.events.push({
      type: 'players.mapping',
      turn: this.turn,
      players,
    });
  }

  /* NOT IMPLEMENTED */
  stats() {
    return {};
  }

  /* NOT IMPLEMENTED */
  getPlayerStats(player: Player) {
    return null;
  }

  private toBigInt(value: number | bigint): bigint {
    return typeof value === 'bigint' ? value : BigInt(Math.round(value));
  }
}
