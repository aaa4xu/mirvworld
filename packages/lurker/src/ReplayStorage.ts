import { type ArchivedGameRecord } from './OpenFront/Schema/ArchivedGameResponse.ts';
import { S3Client } from 'bun';

export class ReplayStorage {
  public constructor(private readonly client: S3Client) {}

  public async save(id: string, replay: ArchivedGameRecord) {
    const json = JSON.stringify(replay, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
    await this.client.write(this.filename(replay.gitCommit, id), json, {
      type: 'application/json',
    });
  }

  private filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json`;
  }
}
