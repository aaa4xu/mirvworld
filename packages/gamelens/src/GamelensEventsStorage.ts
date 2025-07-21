import { JSONStorage } from 'compressed-storage/src/JSONStorage.ts';
import { CompressedStorage, type Storage } from 'compressed-storage';
import { type GamelensEvents, GamelensEventsSchema } from './Events.ts';

export class GamelensEventsStorage {
  private readonly storage: JSONStorage<typeof GamelensEventsSchema>;

  public constructor(storage: Storage, compressionLevel = 22) {
    this.storage = new JSONStorage(
      new CompressedStorage(storage, compressionLevel),
      GamelensEventsSchema,
      (k: string, v: any) => (typeof v === 'bigint' ? v.toString() : v),
    );
  }

  public async save(gitCommit: string, id: string, replay: GamelensEvents) {
    await this.storage.write(this.filename(gitCommit, id), replay);
  }

  public async read(filename: string) {
    return this.storage.read(filename);
  }

  public filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json`;
  }
}
