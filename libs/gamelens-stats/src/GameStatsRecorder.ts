import { PlayerStatsRecorder } from './PlayerStatsRecorder.ts';
import type { PlayerStats } from './PlayerStats.ts';
import type { GameStats } from './GameStats.ts';
import { PlayerType } from 'openfront/game/src/core/game/Game.ts';
import type { GameLensStats } from './GameLensStats.ts';

export class GameStatsRecorder {
  public readonly players = new Map<number, PlayerStatsRecorder>();
  public duration = 0;

  public constructor() {}

  public addPlayer(id: number, name: string, team: string | null, clientId: string, type: PlayerType) {
    if (this.players.has(id)) {
      return this.players.get(id)!;
    }

    const playerRecorder = new PlayerStatsRecorder(id, clientId, name, team, type);
    this.players.set(id, playerRecorder);

    return playerRecorder;
  }

  public player(id: number) {
    const player = this.players.get(id);
    if (!player) {
      throw new Error(`Player with id ${id} does not exist`);
    }

    return player;
  }

  public hasPlayer(id: number) {
    return this.players.has(id);
  }

  public setDuration(turns: number) {
    this.duration = turns;
    return this;
  }

  public toStats(): GameLensStats {
    const players = Array.from(this.players.values());
    const tiles = new Map<number, number>();
    const getTotalTilesForTurn = (turn: number) => {
      if (!tiles.has(turn)) {
        tiles.set(
          turn,
          players.reduce((acc, p) => {
            return acc + (p.tiles.get(turn) ?? 0);
          }, 0),
        );
      }

      return tiles.get(turn)!;
    };

    const matchDuration = BigInt(Math.round(this.duration / 10 / 60));

    return {
      players: players
        .filter((p) => p.type === PlayerType.Human)
        .map((pl) => {
          const tiles = Object.fromEntries(
            Array.from(pl.tiles.entries()).map(([turn, tiles]) => [turn, tiles / getTotalTilesForTurn(turn)]),
          );
          const maxTiles = Math.max(0, ...Object.values(tiles));
          const lastTiles = tiles[this.duration] ?? 0;

          return {
            id: pl.clientId,
            name: pl.name,
            team: pl.team,
            buildOrder: pl.buildOrder,
            firstBuild: pl.firstBuild,
            death: pl.death,
            maxTiles,
            tiles: lastTiles,
            goldPerMinute: Number(pl.goldEarned / matchDuration) / 1000,
            incomingTroopsPerMinute: Number(pl.incomingTroops / matchDuration / 1000n) / 10,
            outgoingTroopsPerMinute: Number(pl.outgoingTroops / matchDuration / 1000n) / 10,
            spawnX: pl.spawnX,
            spawnY: pl.spawnY,
          };
        }),
      game: {},
    };
  }
}
