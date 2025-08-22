import type { Db } from 'mongodb';
import { MatchesRepository } from './mongodb/Repositories/MatchesRepository.ts';
import { RedisClient } from 'bun';

export class Meta {
  public constructor(
    public readonly versions: string[],
    private readonly db: Db,
    private readonly redis: RedisClient,
  ) {}

  public async stats() {
    const [matchDuration, goldPerMinute, goldPerMinuteTop5, goldPerMinuteTop10] = await Promise.all([
      this.matchDuration(),
      this.goldPerMinute(),
      this.goldPerMinute(5),
      this.goldPerMinute(10),
    ]);

    return {
      matchDuration,
      goldPerMinute,
      goldPerMinuteTop5,
      goldPerMinuteTop10,
    };
  }

  public async matchDuration() {
    const results = await this.db
      .collection(MatchesRepository.collectionName)
      .aggregate<{ median: number }>([
        // Keep only docs with valid dates and selected versions
        {
          $match: {
            version: { $in: this.versions },
            startedAt: { $type: 'date' },
            finishedAt: { $type: 'date' },
          },
        },
        // Compute duration in minutes
        {
          $project: {
            durationMin: { $divide: [{ $subtract: ['$finishedAt', '$startedAt'] }, 60000] },
          },
        },
        // Median
        {
          $group: {
            _id: null,
            medianArr: {
              $percentile: { p: [0.5], input: '$durationMin', method: 'approximate' },
            },
          },
        },
        // Unwrap percentile array
        {
          $project: {
            _id: 0,
            median: { $arrayElemAt: ['$medianArr', 0] },
          },
        },
      ])
      .toArray();

    return results[0]?.median ?? 0;
  }

  public async goldPerMinute(top?: number): Promise<number> {
    // Median GPM across all players from the selected versions
    const results = await this.db
      .collection(MatchesRepository.collectionName)
      .aggregate<{ median: number }>([
        // Filter by versions and keep only finished matches for safety
        {
          $match: {
            version: { $in: this.versions },
            finishedAt: { $type: 'date' },
          },
        },
        // Flatten players
        { $unwind: '$players' },
        {
          $match: {
            'players.goldPerMinute': { $type: 'number' },
            $or: [{ 'players.death': { $lt: 0 } }, { 'players.death': { $gt: 300 } }], // Only active players
            ...(top ? { 'players.rank': { $lte: top } } : {}), // Keep only top ranks
          },
        },
        // Median (p=0.5) across all qualifying players
        {
          $group: {
            _id: null,
            medianArr: {
              $percentile: { p: [0.5], input: '$players.goldPerMinute', method: 'approximate' },
            },
          },
        },
        // Unwrap percentile array
        { $project: { _id: 0, median: { $arrayElemAt: ['$medianArr', 0] } } },
      ])
      .toArray();

    return results[0]?.median ?? 0;
  }
}
