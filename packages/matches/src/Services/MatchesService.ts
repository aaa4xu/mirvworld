import type { MatchesRepository } from '../mongodb/Repositories/MatchesRepository.ts';
import type { ReplayStorage } from 'replay-storage';
import type { OpenFrontPublicAPI } from '@mirvworld/openfront-api';
import { GameRecordSchema } from 'openfront/src/Schema.ts';
import type { PlayerStats } from '@mirvworld/gamelens-stats';
import type { MatchDTO } from '../mongodb/Models/Match.ts';
import z from 'zod';
import type { MatchPlayer, MatchPlayerInfo } from '../mongodb/Models/MatchPlayer.ts';
import type { ObjectId } from 'mongodb';
import debug from 'debug';

const logger = debug('mirvworld:matches:MatchesService');

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
    logger(`Downloading replay file ${filename}`);
    const genericReplay = await this.replays.read(filename);

    logger(`Parsing replay file ${filename}`);
    const replay = GameRecordSchema.pick({ info: true, gitCommit: true }).parse(genericReplay);

    const winner = replay.info.players.find((p) => p.clientID === replay.info.winner?.[1])?.username ?? undefined;

    logger(`Importing data from ${filename} to database`);
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
    logger(`Imported data from ${filename} to database`);
  }

  public async setPlayers(id: MatchDTO['id'], players: Array<MatchPlayer>) {
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

    await this.repository.setPlayers(match.id, players, winner === null ? undefined : winner);
  }

  public async setMatchPlayerInfo(matchId: string, playerId: string, info: MatchPlayerInfo) {
    const match = await this.read(matchId);
    if (!match) {
      console.warn(`[${this.constructor.name}][${matchId}] Failed to update player info in match: match not found`);
      return;
    }

    if (match.players.length === 0) {
      console.warn(`[${this.constructor.name}][${matchId}] Failed to update player info in match: players is empty`);
      return;
    }

    const player = match.players.find((p) => p.id === playerId);
    if (!player) {
      console.error(
        `[${this.constructor.name}][${match.gameId}] Failed to update player info in match: Cannot find player with id ${playerId}`,
      );
      return;
    }

    player.info = info;
    await this.repository.setPlayers(match.id, match.players);
    console.log(`[${this.constructor.name}][${match.gameId}] Updated info for player ${playerId}`);
  }

  public async updateMatchPlayerInfo(playerId: ObjectId, info: MatchPlayerInfo) {
    const matches = await this.repository.searchByPlayerRef(playerId);

    await Promise.all(
      matches.map((match) => {
        const player = match.players.find((p) => p.info?.id === playerId);
        if (!player) {
          console.error(`[${this.constructor.name}][${match.gameId}] Cannot find player with id ${playerId}`);
          return;
        }

        player.info = info;
        return this.repository.setPlayers(match.id, match.players);
      }),
    );
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
