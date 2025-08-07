import { type Game, type Player, PlayerType, type TerraNullius } from 'openfront/game/src/core/game/Game';
import type { Stats as GameStats } from 'openfront/game/src/core/game/Stats';
import type { NukeType, OtherUnitType } from 'openfront/game/src/core/StatsSchemas';
import z from 'zod';
import type { TurnSchema } from 'openfront/game/src/core/Schemas.ts';
import { GameStatsRecorder } from '@mirvworld/gamelens-stats/src/GameStatsRecorder.ts';

export class Stats implements GameStats {
  private turn = 0;
  private readonly recorder = new GameStatsRecorder();

  public getStats() {
    return this.recorder.toStats();
  }

  public startTurn(turn: z.infer<typeof TurnSchema>, game: Game) {
    this.turn = turn.turnNumber;

    if (game.inSpawnPhase()) {
      for (const player of game.allPlayers()) {
        if (this.recorder.hasPlayer(player.smallID())) continue;

        let clientId = player.clientID();

        if (!clientId) {
          console.warn(`Player #${player.smallID()} "${player.name()}" has no client id!`);
          clientId = 's' + player.smallID().toString().padStart(7, '0');
        }

        this.recorder.addPlayer(player.smallID(), player.name(), player.team(), clientId, player.type());
      }
    }

    /*if (this.captureNewOwner !== null) {
      throw new Error('Capture new owner is not null');
    }

    if (this.destroyer !== null) {
      throw new Error('Destroyer is not null');
    }*/

    for (const intent of turn.intents) {
      if (game.inSpawnPhase() && intent.type === 'spawn') {
        const player = game.playerByClientID(intent.clientID);
        if (!player) {
          console.error('Player not found', intent.clientID);
          continue;
        }

        this.recorder.player(player.smallID()).setSpawn(game.x(intent.tile), game.y(intent.tile));
      }
    }

    if (!game.inSpawnPhase() && this.turn % 150 === 0) {
      // 150 turns = 15sec
      this.addTilesEvent(game);
    }
  }

  public endTurn(game: Game) {
    if (!game.inSpawnPhase()) {
      for (const player of game.allPlayers()) {
        if (player.isAlive()) continue;
        if (this.recorder.player(player.smallID()).death >= 0) continue;
        this.deathBySnuSnu(player);
      }
    }
  }

  public startGame(game: Game) {}

  public endGame(game: Game) {
    this.recorder.setDuration(this.turn);
    this.addTilesEvent(game);
  }

  public attack(player: Player, target: Player | TerraNullius, troops: number | bigint): void {
    troops = this.toBigInt(troops);
    this.recorder.player(player.smallID()).increaseOutgoingTroops(troops);

    if (target.isPlayer()) {
      this.recorder.player(target.smallID()).increaseIncomingTroops(troops);
    }
  }

  public attackCancel(player: Player, target: Player | TerraNullius, troops: number | bigint): void {}

  public betray(player: Player): void {
    // v0.24.0: А где второй игрок???
  }

  public boatArriveTrade(player: Player, target: Player, gold: number | bigint): void {
    // v0.24.0: нигде не вызывается, добавил через патчи
    // Торговец player прибыл в порт target
    gold = this.toBigInt(gold);
    this.recorder.player(player.smallID()).increaseGold(gold);
    this.recorder.player(target.smallID()).increaseGold(gold);
  }

  public boatArriveTroops(player: Player, target: Player | TerraNullius, troops: number | bigint): void {
    // v0.24.0: Бесполезное событие, так как вызывается даже тогда,
    // когда лодка приплыла на свой собственный или дружественный берег
  }

  public boatCapturedTrade(player: Player, target: Player, gold: number | bigint): void {
    // v0.24.0: нигде не вызывается, добавил через патчи
    // Захваченный торговец target прибыл в порт player
    this.recorder.player(player.smallID()).increaseGold(this.toBigInt(gold));
  }

  public boatDestroyTrade(player: Player, target: Player): void {
    /*this.events.push({
      type: 'trade.destroyed',
      turn: this.turn,
      player: player.smallID(),
      owner: target.smallID(),
    });*/
  }

  public boatDestroyTroops(player: Player, target: Player, troops: number | bigint): void {}

  public boatSendTrade(player: Player, target: Player): void {}

  public boatSendTroops(player: Player, target: Player | TerraNullius, troops: number | bigint): void {}

  public bombIntercept(player: Player, type: NukeType, count: number | bigint): void {}

  public bombLand(player: Player, target: Player | TerraNullius, type: NukeType): void {
    /*if (target.isPlayer()) {
      this.events.push({
        type: 'bomb.landed.player',
        turn: this.turn,
        player: player.smallID(),
        target: target.smallID(),
        nukeType: type,
      });
    } else {
      this.events.push({
        type: 'bomb.landed.terra',
        turn: this.turn,
        player: player.smallID(),
        nukeType: type,
      });
    }*/
  }

  public bombLaunch(player: Player, target: Player | TerraNullius, type: NukeType): void {
    /*if (target.isPlayer()) {
      this.events.push({
        type: 'bomb.launched.player',
        turn: this.turn,
        player: player.smallID(),
        target: target.smallID(),
        nukeType: type,
      });
    } else {
      this.events.push({
        type: 'bomb.launched.terra',
        turn: this.turn,
        player: player.smallID(),
        nukeType: type,
      });
    }*/
  }

  public goldWar(player: Player, captured: Player, gold: number | bigint): void {
    this.recorder.player(captured.smallID()).killed(this.turn);
    this.recorder.player(player.smallID()).increaseGold(this.toBigInt(gold));
  }

  public goldWork(player: Player, gold: number | bigint): void {
    this.recorder.player(player.smallID()).increaseGold(this.toBigInt(gold));
  }

  public unitBuild(player: Player, type: OtherUnitType): void {
    this.recorder.player(player.smallID()).addBuild(this.turn, type);
  }

  public unitCapture(player: Player, type: OtherUnitType): void {
    /*if (this.captureNewOwner !== null) {
      throw new Error('Already capturing');
    }

    this.captureNewOwner = player.smallID();*/
  }

  public unitDestroy(player: Player, type: OtherUnitType): void {
    /*if (this.destroyer !== null) {
      throw new Error('Already destroying');
    }

    this.destroyer = player.smallID();*/
  }

  public unitLose(player: Player, type: OtherUnitType): void {
    /*if (this.captureNewOwner !== null) {
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
    }*/
  }

  public unitUpgrade(player: Player, type: OtherUnitType): void {
    /*this.events.push({
      type: 'unit.build',
      turn: this.turn,
      player: player.smallID(),
      unit: type,
    });*/
  }

  private deathBySnuSnu(player: Player) {
    console.warn('Death by SnuSnu:', 'smallId=', player.smallID(), 'name=', player.name());
    this.recorder.player(player.smallID()).killed(this.turn);
  }

  private addTilesEvent(game: Game) {
    for (const pl of game.players()) {
      this.recorder.player(pl.smallID()).territoryHistory(this.turn, pl.numTilesOwned());
    }
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
