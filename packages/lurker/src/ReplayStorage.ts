import { type ArchivedGameRecord, ArchivedGameRecordSchema } from './OpenFront/Schema/ArchivedGameResponse.ts';
import { JSONStorage } from 'compressed-storage/src/JSONStorage.ts';
import type { Storage } from 'compressed-storage';

export class ReplayStorage {
  private readonly storage: JSONStorage<typeof ArchivedGameRecordSchema>;

  public constructor(storage: Storage) {
    this.storage = new JSONStorage(storage, ArchivedGameRecordSchema);
  }

  public async save(id: string, replay: ArchivedGameRecord) {
    await this.storage.write(this.filename(replay.gitCommit, id), replay);
  }

  public async read(filename: string) {
    return this.storage.read(filename);
  }

  private filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json`;
  }
}
