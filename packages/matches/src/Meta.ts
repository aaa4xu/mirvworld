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
    const [matchDuration, goldPerMinute, goldPerMinuteTop5, goldPerMinuteTop10, ffaBuildOrder, teamsBuildOrder] =
      await Promise.all([
        this.matchDuration(),
        this.goldPerMinute(),
        this.goldPerMinute(5),
        this.goldPerMinute(10),
        this.buildOrderPerformance('ffa', 4, 0.004),
        this.buildOrderPerformance('teams', 4, 0.004),
      ]);

    return {
      matchDuration,
      gpm: {
        goldPerMinute,
        goldPerMinuteTop5,
        goldPerMinuteTop10,
      },
      buildOrders: {
        ffa: ffaBuildOrder.slice(0, 10),
        teams: teamsBuildOrder.slice(0, 10),
      },
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

  public buildOrderPerformance(mode: string, buildPrefixLen: number, minShare = 0.01) {
    return this.db
      .collection(MatchesRepository.collectionName)
      .aggregate<{ median: number }>([
        // Only selected mode and versions
        { $match: { mode, version: { $in: this.versions } } },
        // Compute lobby size per match
        {
          $project: {
            players: 1,
            lobbySize: { $size: '$players' },
          },
        },
        // One row per player
        { $unwind: '$players' },
        // Extract rank, original buildOrder, and build key (first N chars)
        {
          $project: {
            lobbySize: 1,
            rank: '$players.rank',
            buildOrder: '$players.buildOrder',
            buildKey: { $substrBytes: ['$players.buildOrder', 0, buildPrefixLen] }, // first N builds
          },
        },
        // Keep valid rank, lobby size, and ORIGINAL buildOrder length >= N
        {
          $match: {
            rank: { $type: 'number', $gte: 1 },
            lobbySize: { $gte: 2 },
            $expr: { $gte: [{ $strLenBytes: '$buildOrder' }, buildPrefixLen] },
          },
        },
        // Compute placement percentile in [0..1]
        {
          $addFields: {
            placementPct: {
              $divide: [{ $subtract: ['$rank', 1] }, { $subtract: ['$lobbySize', 1] }],
            },
          },
        },
        // Group by build key; median placement percentile and players count
        {
          $group: {
            _id: '$buildKey',
            playersCount: { $sum: 1 },
            avgPlacementPct: { $avg: '$placementPct' }, // average instead of median
          },
        },
        {
          $project: {
            _id: 0,
            buildOrder: '$_id',
            playersCount: 1,
            avgPlacementPct: '$avgPlacementPct',
          },
        },
        // Keep only build orders with a significant share
        {
          $group: {
            _id: null,
            totalPlayers: { $sum: '$playersCount' },
            rows: { $push: '$$ROOT' },
          },
        },
        { $unwind: '$rows' },
        { $addFields: { share: { $divide: ['$rows.playersCount', '$totalPlayers'] } } },
        { $match: { share: { $gte: minShare } } },
        // Final shape
        {
          $project: {
            _id: 0,
            buildOrder: '$rows.buildOrder',
            playersCount: '$rows.playersCount',
            sharePct: '$share',
            avgPlacementPct: '$rows.avgPlacementPct',
          },
        },
        // Sort by better builds first
        { $sort: { avgPlacementPct: 1 } },
      ])
      .toArray();
  }
}
