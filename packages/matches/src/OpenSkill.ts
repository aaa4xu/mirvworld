import { rate, type Team } from 'openskill';
import type { PlayerStats } from '@mirvworld/gamelens-stats';
import type { ClanRating } from './Schema/ClanRating.ts';
import type { ClanRatingRepository } from './Repositories/ClanRatingRepository.ts';

export class OpenSkill {
  public static readonly EmptyTeamTag = '$$$$$';

  public constructor(private readonly repository: ClanRatingRepository) {}

  public leaderboard(page = 1, limit = 100) {
    return this.repository.getTop(limit, (page - 1) * limit);
  }

  public async apply(gameId: string, players: Array<PlayerStats>) {
    const teams = this.groupByTeam(players);
    const rows = this.buildTeamRows(teams);
    if (rows.length < 2) return; // not enough clan-bearing teams

    const tags = this.collectTags(rows);
    if (tags.length < 2) return; // not enough clans

    const priors = await this.getCurrentRating(tags);
    const before = this.buildModelInput(rows, priors);
    const after = rate(before, { rank: rows.map((r) => r.placement) });
    const deltas = this.aggregateDeltas(rows, before, after);
    await this.applyDeltas(gameId, deltas);
  }

  /** Collects distinct clan tags across all team rows. */
  private collectTags(rows: Array<{ tags: string[] }>) {
    return Array.from(new Set(rows.flatMap((r) => r.tags)));
  }

  private extractClanTag(nickname: string) {
    const m = /^\s*\[([A-Za-z0-9]{2,4})]/.exec(nickname);
    return m ? m[1]!.toUpperCase() : OpenSkill.EmptyTeamTag;
  }

  /**
   * Groups an array of player statistics by their respective teams
   */
  private groupByTeam(players: Array<PlayerStats>) {
    const teams = new Map<string, Array<PlayerStats>>();
    for (const p of players) {
      let k = p.team;
      if (!k) continue;

      const list = teams.get(k);
      if (list) list.push(p);
      else teams.set(k, [p]);
    }

    return teams;
  }

  /**
   * Counts the number of players in each clan based on their clan tags
   */
  private countClanSlots(team: Array<PlayerStats>) {
    const clans = new Map<string, number>();
    for (const p of team) {
      const tag = this.extractClanTag(p.name);
      if (!tag || tag === OpenSkill.EmptyTeamTag) continue;
      clans.set(tag, (clans.get(tag) ?? 0) + 1);
    }
    for (const [tag, n] of clans) {
      if (n < 2) clans.delete(tag);
    }
    return clans;
  }

  private async getCurrentRating(tags: string[]) {
    const priors = new Map<string, ClanRating>();
    await Promise.all(
      tags.map(async (t) => {
        const r = await this.repository.getRating(t);
        priors.set(t, r);
      }),
    );
    return priors;
  }

  private buildTeamRows(teams: Map<string, Array<PlayerStats>>) {
    const rows: Array<{ placement: number; tags: string[]; weights: number[] }> = [];
    for (const team of teams.values()) {
      const counts = this.countClanSlots(team);
      if (counts.size === 0) continue; // skip teams without any clan-tagged players
      const placement = Math.min(...team.map((p) => p.rank));
      const tags: string[] = [];
      const weights: number[] = [];
      for (const [tag, n] of counts) {
        tags.push(tag);
        weights.push(this.weightSlots(n));
      }
      rows.push({ placement, tags, weights });
    }
    return rows.sort((a, b) => a.placement - b.placement).map((r, i) => ({ ...r, placement: i + 1 }));
  }

  /**
   * Weight function with diminishing returns for multiple same-clan members.
   */
  private weightSlots(n: number): number {
    return Math.sqrt(Math.max(0, n));
  }

  /** Builds OpenSkill matrices (before) for each (team, tag) entry. */
  private buildModelInput(rows: Array<{ tags: string[] }>, priors: Map<string, ClanRating>) {
    return rows.map((row) => row.tags.map((tag) => priors.get(tag)!));
  }

  /** Aggregates deltas per clan tag across all teams; sets dGames = 1 per clan. */
  private aggregateDeltas(
    rows: Array<{ tags: string[]; weights: number[] }>,
    before: Array<Array<ClanRating>>,
    after: Team[],
  ) {
    const agg = new Map<string, { dMu: number; dSigma: number }>();
    for (let ti = 0; ti < rows.length; ti++) {
      const wSum = rows[ti]!.weights.reduce((a, b) => a + b, 0) || 1;
      for (let j = 0; j < rows[ti]!.tags.length; j++) {
        const tag = rows[ti]!.tags[j]!;
        const share = rows[ti]!.weights[j]! / wSum;
        const dMu = (after[ti]![j]!.mu - before[ti]![j]!.mu) * share;
        const dSigma = (after[ti]![j]!.sigma - before[ti]![j]!.sigma) * share;
        const cur = agg.get(tag) ?? { dMu: 0, dSigma: 0 };
        cur.dMu += dMu;
        cur.dSigma += dSigma;
        agg.set(tag, cur);
      }
    }
    return Array.from(agg, ([tag, v]) => ({ tag, dMu: v.dMu, dSigma: v.dSigma, dGames: 1 }));
  }

  /** Applies deltas atomically via repository Lua script (idempotent by gameId). */
  private async applyDeltas(
    gameId: string,
    deltas: Array<{ tag: string; dMu: number; dSigma: number; dGames: number }>,
  ) {
    if (deltas.length === 0) return;
    await this.repository.applyDeltas(gameId, deltas);
  }
}
