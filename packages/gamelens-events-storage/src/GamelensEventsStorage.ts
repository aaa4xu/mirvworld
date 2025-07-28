import { CompressedStorage, JSONStorage, type Storage } from 'compressed-storage';
import { type GamelensEvents, GamelensEventsSchema } from './GamelensEvents.ts';

export class GamelensEventsStorage {
  private readonly storage: JSONStorage<GamelensEvents>;

  public constructor(storage: Storage, compressionLevel = 17) {
    // @ts-ignore "Type instantiation is excessively deep and possibly infinite". Когда там уже релиз ts-rs?
    this.storage = new JSONStorage<GamelensEvents>(
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
