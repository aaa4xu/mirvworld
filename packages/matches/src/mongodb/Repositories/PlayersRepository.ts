import { Collection, type Db, ObjectId } from 'mongodb';
import type { Player } from '../Models/Player.ts';

export class PlayersRepository {
  private readonly collection: Collection<Omit<Player, '_id'>>;

  public constructor(db: Db) {
    this.collection = db.collection('players');
  }

  public async read(id: string | ObjectId): Promise<Player | null> {
    if (typeof id === 'string' && id.length === 24) {
      id = new ObjectId(id);
    }

    if (id instanceof ObjectId) {
      return this.collection.findOne({ _id: id });
    } else {
      return this.collection.findOne({ publicId: id });
    }
  }

  public async updateBatch() {
    return this.collection
      .aggregate<Player>([
        {
          $match: {
            updatedAt: {
              $lt: new Date(Date.now() - 15 * 60 * 1000),
            },
          },
        },
        {
          $sort: {
            updatedAt: 1,
          },
        },
      ])
      .limit(5)
      .toArray();
  }

  public async upsert(player: Omit<Player, '_id' | 'createdAt' | 'updatedAt'>) {
    const current = await this.collection.findOne({ publicId: player.publicId });

    if (
      current &&
      current.publicId === player.publicId &&
      player.avatar === current.avatar &&
      player.name === current.name
    ) {
      await this.collection.updateOne(
        {
          publicId: player.publicId,
        },
        {
          $set: {
            updatedAt: new Date(),
          },
        },
      );

      return false;
    }

    await this.collection.updateOne(
      {
        publicId: player.publicId,
      },
      {
        $set: {
          ...player,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    return true;
  }
}
