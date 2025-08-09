import type { TournamentWithMatches } from '../../mongodb/Repositories/TournamentsRepository.ts';
import type { MatchDTO } from '../../mongodb/Models/Match.ts';
import type { MatchPlayer } from '../../mongodb/Models/MatchPlayer.ts';
import type { LeaderboardEntry } from '../LeaderboardEntry.ts';

export class MaxTilesScoringRule {
  public static readonly id = 'max-tiles' as const;

  public constructor(public readonly scores: Array<number>) {}

  public leaderboard(tournament: TournamentWithMatches) {
    const aliasMap = this.buildAliasMap(tournament.aliases);

    const totals = new Map<string, { score: number; matches: number; player: MatchPlayer }>();

    for (const match of tournament.matchesData) {
      const perMatch = this.scoreSingleMatch(match, aliasMap);
      for (const [key, { points, player }] of perMatch) {
        const prev = totals.get(key);
        if (prev) {
          prev.score += points;
          prev.matches += 1;
        } else {
          totals.set(key, { score: points, matches: 1, player });
        }
      }
    }

    const rows: LeaderboardEntry[] = [];
    for (const { player, score, matches } of totals.values()) {
      rows.push({ score, matches, name: this.applyAliases(player.name, aliasMap) });
    }
    // Sort by score desc, then by name asc for stable output
    rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return rows;
  }

  private scoreSingleMatch(
    match: MatchDTO,
    aliasMap: Map<string, string>,
  ): Map<string, { points: number; player: MatchPlayer }> {
    match.players.sort((a, b) => b.maxTiles - a.maxTiles);

    const groups: Array<{ start: number; size: number; rank: number }> = [];
    for (let i = 0, rank = 1; i < match.players.length; ) {
      let j = i + 1;
      while (j < match.players.length && match.players[j]!.maxTiles === match.players[i]!.maxTiles) j++;
      groups.push({ start: i, size: j - i, rank });
      rank += j - i; // competition progression
      i = j;
    }

    const result = new Map<string, { points: number; player: MatchPlayer }>();
    for (const g of groups) {
      const avgPoints = this.averagePointsForSpan(g.rank, g.size);
      for (let k = 0; k < g.size; k++) {
        const idx = g.start + k;
        const displayName = this.applyAliases(match.players[idx]!.name, aliasMap);
        const key = this.normalizePlayerName(displayName); // stable map key
        const prev = result.get(key);
        if (prev) {
          prev.points += avgPoints;
        } else {
          result.set(key, { points: avgPoints, player: match.players[idx]! });
        }
      }
    }

    return result;
  }

  /**
   * Average the points for the occupied places [rank ... rank+size-1].
   * Out-of-range places (beyond scores.length) contribute 0.
   */
  private averagePointsForSpan(rank: number, size: number): number {
    let sum = 0;
    for (let pos = rank; pos < rank + size; pos++) {
      sum += this.scores[pos - 1] ?? 0;
    }
    return sum / size;
  }

  private normalizePlayerName(name: string): string {
    return name.normalize('NFKC').trim().toLowerCase();
  }

  private applyAliases(name: string, aliasMap: Map<string, string>): string {
    return aliasMap.get(this.normalizePlayerName(name)) ?? name;
  }

  private buildAliasMap(aliases: Record<string, string>): Map<string, string> {
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(aliases)) {
      map.set(this.normalizePlayerName(k), v);
    }

    return map;
  }
}
