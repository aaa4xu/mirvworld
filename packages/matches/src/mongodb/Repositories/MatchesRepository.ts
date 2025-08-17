import { Collection, type Db, type Document, ObjectId } from 'mongodb';
import { type Match, type MatchDTO, MatchDTOSchema, type MatchInsert, MatchInsertSchema } from '../Models/Match.ts';
import type { PlayerStats } from '@mirvworld/gamelens-stats';
import z from 'zod';

export class MatchesRepository {
  public static readonly collectionName = 'matches';

  private readonly collection: Collection<Omit<Match, '_id'>>;

  public constructor(db: Db) {
    this.collection = db.collection(MatchesRepository.collectionName);
  }

  public async searchByPlayer(name: string): Promise<Array<MatchDTO>> {
    const items = await this.collection
      .aggregate<Match>([
        {
          $match: {
            'players.name': {
              $regex: name,
              $options: 'i',
            },
          },
        },
        { $sort: { _id: -1 } },
      ])
      .limit(20)
      .toArray();

    return this.toArrayDTO(items);
  }

  public async read(id: MatchDTO['id']): Promise<MatchDTO | null> {
    return this.toDTO(await this.collection.findOne({ _id: new ObjectId(id) }));
  }

  public async readByGameId(gameId: MatchDTO['gameId']): Promise<MatchDTO | null> {
    return this.toDTO(await this.collection.findOne({ gameId: gameId }));
  }

  public async latest(): Promise<Array<MatchDTO>> {
    /* The first 4 bytes of ObjectId is timestamp, so sorting by _id should by close enough to sorting by createdAt */
    const items = await this.collection
      .aggregate<Match>([{ $sort: { _id: -1 } }])
      .limit(20)
      .toArray();

    return this.toArrayDTO(items);
  }

  public async setPlayers(id: MatchDTO['id'], players: Array<PlayerStats>, winner?: string) {
    const res = await this.collection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          players,
          ...(winner ? { winner } : {}),
        },
      },
    );

    return res.matchedCount > 0;
  }

  public async searchByPlayerRef(playerId: ObjectId) {
    return this.toArrayDTO(
      await this.collection
        .find({
          'players.info.id': playerId,
        })
        .toArray(),
    );
  }

  public async add(match: MatchInsert) {
    const parsed = MatchInsertSchema.parse(match);
    await this.collection.insertOne(parsed);
  }

  public toDTO(match: Match | null): MatchDTO | null {
    if (!match) return null;

    const dto = {
      ...match,
      id: match._id.toString(),
    };

    const result = MatchDTOSchema.safeParse(dto);

    if (result.success) {
      return result.data;
    } else {
      console.error(`[${this.constructor.name}][${match._id}] Failed to parse match:`, z.prettifyError(result.error));
      return null;
    }
  }

  public toArrayDTO(matches: Array<Match>): Array<MatchDTO> {
    return matches.map((m) => this.toDTO(m)).filter((m): m is MatchDTO => m !== null);
  }

  public async *iterateTeamMatchesWithRanks(opts?: {
    batchSize?: number; // default 500
  }): AsyncGenerator<{ gameId: string; players: Array<PlayerStats> }> {
    const batchSize = opts?.batchSize ?? 500;

    // Pipeline ensures:
    //  - mode == 'teams'
    //  - players array is non-empty
    //  - EVERY player has rank present and >= 1
    const pipeline: Document[] = [
      { $match: { mode: 'teams' } },
      { $match: { 'players.0': { $exists: true } } }, // non-empty players
      { $sort: { _id: 1 } }, // chronological order
      { $project: { gameId: 1, players: 1 } }, // keep only needed fields
      {
        $match: {
          $expr: {
            $eq: [
              { $size: '$players' },
              {
                $size: {
                  $filter: {
                    input: '$players',
                    as: 'p',
                    cond: {
                      $and: [{ $ne: ['$$p.rank', null] }, { $gte: ['$$p.rank', 1] }],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ];

    const cursor = this.collection.aggregate<{ gameId: string; players: Array<PlayerStats> }>(pipeline, {
      allowDiskUse: true,
    });

    // Set batch size to keep memory bounded
    if (typeof cursor.batchSize === 'function') cursor.batchSize(batchSize);

    for await (const doc of cursor) {
      yield { gameId: doc.gameId, players: doc.players };
    }
  }
}
