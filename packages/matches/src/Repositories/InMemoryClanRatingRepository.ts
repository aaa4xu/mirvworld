import type { ClanRating, ClanRatingDelta } from '../Schema/ClanRating.ts';
import type { ClanRatingRepository, ClanRatingScore, DefaultParams } from './ClanRatingRepository.ts';

export class InMemoryClanRatingRepository implements ClanRatingRepository {
  private readonly k: number;
  private readonly mu0: number;
  private readonly sigma0: number;

  private readonly ratings = new Map<string, ClanRating>();
  private readonly processed = new Set<string>();

  constructor(params: Partial<DefaultParams> = {}) {
    this.k = params.k ?? 3;
    this.mu0 = params.mu ?? 25;
    this.sigma0 = params.sigma ?? this.mu0 / this.k;
  }

  /** Returns a normalized clan tag used as the map key. */
  private normalize(tag: string): string {
    return tag.trim().toUpperCase();
  }

  /** Safe ordinal score = mu - k * sigma. */
  private score(r: ClanRating): number {
    return r.mu - this.k * r.sigma;
  }

  /** Retrieves the clan rating for a given tag (or null if absent). */
  public async getRating(tag: string): Promise<ClanRating> {
    const t = this.normalize(tag);
    return this.ratings.get(t) ?? { mu: this.mu0, sigma: this.sigma0, games: 0 };
  }

  /** Retrieves top-N by score (descending). */
  public async getTop(limit = 50, offset = 0): Promise<ClanRatingScore[]> {
    const all: ClanRatingScore[] = [];
    for (const [tag, r] of this.ratings) {
      all.push({ tag, score: this.score(r), games: 0 });
    }
    all.sort((a, b) => b.score - a.score);
    return all.slice(offset, Math.max(0, limit));
  }

  /**
   * Applies rating deltas for a single match.
   */
  public async applyDeltas(gameId: string, deltas: ClanRatingDelta[]): Promise<void> {
    if (this.processed.has(gameId)) return;
    if (!Array.isArray(deltas) || deltas.length === 0) {
      this.processed.add(gameId);
      return;
    }

    for (const d of deltas) {
      const tag = this.normalize(d.tag);
      const cur = this.ratings.get(tag) ?? { mu: this.mu0, sigma: this.sigma0, games: 0 };

      const mu = cur.mu + d.mu;
      const sigma = Math.max(0.001, cur.sigma + d.sigma);
      const games = Math.max(0, cur.games + d.games);

      this.ratings.set(tag, { mu, sigma, games });
    }

    this.processed.add(gameId);
  }
}
