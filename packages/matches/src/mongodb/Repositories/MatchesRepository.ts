import { Collection, type Db, ObjectId } from 'mongodb';
import { type Match, type MatchDTO, MatchDTOSchema, type MatchInsert, MatchInsertSchema } from '../Models/Match.ts';
import type { PlayerStats } from '@mirvworld/gamelens-stats';
import z from 'zod/v4';

export class MatchesRepository {
  private readonly collection: Collection<Omit<Match, '_id'>>;

  public constructor(db: Db) {
    this.collection = db.collection('matches');
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

  public async readByGameId(gameId: string): Promise<MatchDTO | null> {
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

  public async setPlayers(id: MatchDTO['id'], players: Array<PlayerStats>) {
    await this.collection.updateOne(
      {
        gameId: id,
      },
      {
        $set: {
          players,
        },
      },
    );
  }

  public async add(match: MatchInsert) {
    const parsed = MatchInsertSchema.parse(match);
    await this.collection.insertOne(parsed);
  }

  private toDTO(match: Match | null): MatchDTO | null {
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

  private toArrayDTO(matches: Array<Match>): Array<MatchDTO> {
    return matches.map((m) => this.toDTO(m)).filter((m): m is MatchDTO => m !== null);
  }
}
