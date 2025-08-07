import { JSONStorage } from 'compressed-storage/src/JSONStorage.ts';
import { CompressedStorage, type Storage } from 'compressed-storage';
import { type GenericReplay, GenericReplaySchema } from 'openfront/src/Schema.ts';
import z from 'zod';

export class ReplayStorage {
  private readonly storage: JSONStorage<GenericReplay>;

  public constructor(storage: Storage, compressionLevel = 22) {
    this.storage = new JSONStorage<GenericReplay>(
      new CompressedStorage(storage, compressionLevel),
      GenericReplaySchema,
    );
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
