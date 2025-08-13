import { type ClanRating } from '../Schema/ClanRating.ts';

export interface ClanRatingRepository {
  /**
   * Retrieves the clan rating for a given tag
   */
  getRating(tag: string): Promise<ClanRating>;

  /**
   * Retrieves the top elements from the leaderboard, sorted by score in descending order
   */
  getTop(limit?: number): Promise<Array<ClanRatingScore>>;

  applyDeltas(gameId: string, deltas: ClanDelta[]): Promise<void>;
}

export interface ClanDelta {
  tag: string; // normalized tag
  dMu: number;
  dSigma: number;
  dGames: number; // usually 1 per match per participating clan
}

export interface DefaultParams {
  k: number;
  mu: number;
  sigma: number;
}

export interface ClanRatingScore {
  tag: string;
  score: number;
}
