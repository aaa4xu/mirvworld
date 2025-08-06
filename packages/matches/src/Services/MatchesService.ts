import type { MatchesRepository } from '../mongodb/Repositories/MatchesRepository.ts';
import type { ReplayStorage } from 'replay-storage';
import type { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import type { PlayerStats } from '@mirvworld/gamelens-stats';
import type { MatchDTO } from '../mongodb/Models/Match.ts';
import z from 'zod/v4';

export class MatchesService {
  public constructor(
    private readonly repository: MatchesRepository,
    private readonly replays: ReplayStorage,
    private readonly api: OpenFrontPublicAPI,
  ) {}

  public async enqueue(id: string) {
    const game = await this.repository.readByGameId(id);
    if (game) return; // Game already imported

    const replay = await this.api.game(id, AbortSignal.timeout(5000));
    if (!replay) {
      throw new Error('Replay is not found');
    }

    await this.replays.save(id, replay);
  }

  public async importFromReplay(filename: string) {
    const genericReplay = await this.replays.read(filename);

    const replay = GameRecordSchema.parse(genericReplay);
    const winner = replay.info.players.find((p) => p.clientID === replay.info.winner?.[1])?.username ?? undefined;

    await this.repository.add({
      gameId: replay.info.gameID,
      map: replay.info.config.gameMap,
      mode: replay.info.config.gameMode === 'Free For All' ? 'ffa' : 'teams',
      version: replay.gitCommit,
      maxPlayers: replay.info.config.maxPlayers ?? 0,
      winner: winner,
      startedAt: new Date(replay.info.start),
      finishedAt: new Date(replay.info.end),
      createdAt: new Date(),
      players: [],
    });
  }

  public async setPlayers(id: MatchDTO['id'], players: Array<PlayerStats>) {
    const match = await this.repository.readByGameId(id);
    if (!match) {
      throw new Error('Match not found');
    }

    let winner = match.winner;
    if (match.mode === 'ffa') {
      winner = players.sort((a, b) => b.tiles - a.tiles)[0]?.name ?? winner;
    }

    if (match.mode === 'teams') {
      const teams = Object.values(players).reduce((acc, player) => {
        const team = player.team ?? 'noteam';
        if (!acc.has(team)) {
          acc.set(team, [player]);
        } else {
          acc.get(team)!.push(player);
        }

        return acc;
      }, new Map<string, Array<PlayerStats>>());

      const sortedTeams = Array.from(teams.entries()).sort(
        ([aid, a], [bid, b]) => Math.min(...a.map((p) => p.rank)) - Math.min(...b.map((p) => p.rank)),
      );

      winner = sortedTeams?.[0]?.[0] ?? winner;
    }

    await this.repository.setPlayers(id, players, winner);
  }

  public async read(id: string) {
    try {
      return await this.repository.readByGameId(id);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        console.error('Failed to read match due to validation error:', z.prettifyError(err as any));
        return null;
      } else {
        throw err;
      }
    }
  }

  public searchByPlayer(name: string) {
    return this.repository.searchByPlayer(name);
  }

  public latest() {
    return this.repository.latest();
  }
}
