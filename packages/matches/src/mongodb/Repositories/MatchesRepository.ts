import { Collection, type Db, ObjectId } from 'mongodb';
import { type Match, type MatchDTO, MatchDTOSchema, type MatchInsert, MatchInsertSchema } from '../Models/Match.ts';
import type { PlayerStats } from '@mirvworld/gamelens-stats';

export class MatchesRepository {
  private readonly collection: Collection<Omit<Match, '_id'>>;

  public constructor(db: Db) {
    this.collection = db.collection('matches');
  }

  public async read(id: MatchDTO['id']): Promise<MatchDTO | null> {
    const item = await this.collection.findOne({ _id: new ObjectId(id) });
    return item ? this.toDTO(item) : null;
  }

  public async readByGameId(gameId: string): Promise<MatchDTO | null> {
    const item = await this.collection.findOne({ gameId: gameId });
    return item ? this.toDTO(item) : null;
  }

  public async latest() {
    /* The first 4 bytes of ObjectId is timestamp, so sorting by _id should by close enough to sorting by createdAt */
    const items = await this.collection
      .aggregate<Match>([{ $sort: { _id: -1 } }])
      .limit(20)
      .toArray();

    return items.map((m) => this.toDTO(m));
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

  private toDTO(match: Match): MatchDTO {
    const dto = {
      ...match,
      id: match._id.toString(),
    };

    return MatchDTOSchema.parse(dto);
  }
}
