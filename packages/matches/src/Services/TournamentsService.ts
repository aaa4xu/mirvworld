import type { TournamentsRepository } from '../mongodb/Repositories/TournamentsRepository.ts';
import { ObjectId } from 'mongodb';
import { MaxTilesScoringRule } from '../Tournaments/Rules/MaxTilesScoringRule.ts';

export class TournamentsService {
  public constructor(private readonly repository: TournamentsRepository) {}

  public async readBySlug(slug: string) {
    const tournament = await this.repository.readBySlug(slug);
    if (!tournament) return null;

    const scoring = new MaxTilesScoringRule(tournament.rules.params);
    const leaderboard = scoring.leaderboard(tournament);

    return {
      ...tournament,
      leaderboard,
    };
  }

  public async addMatch(id: string, matchId: string) {
    await this.repository.addMatch(new ObjectId(id), new ObjectId(matchId));
  }
}
