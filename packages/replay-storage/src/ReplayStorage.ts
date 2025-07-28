import { JSONStorage } from 'compressed-storage/src/JSONStorage.ts';
import { CompressedStorage, type Storage } from 'compressed-storage';
import { GenericReplaySchema } from 'openfront/src/Schema.ts';
import z from 'zod/v4';

export class ReplayStorage {
  private readonly storage: JSONStorage<typeof GenericReplaySchema>;

  public constructor(storage: Storage, compressionLevel = 22) {
    this.storage = new JSONStorage(new CompressedStorage(storage, compressionLevel), GenericReplaySchema);
  }

  public async save(id: string, replay: z.infer<typeof GenericReplaySchema>) {
    await this.storage.write(this.filename(replay.gitCommit, id), replay);
  }

  public async read(filename: string) {
    return this.storage.read(filename);
  }

  public filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json`;
  }
}
