import { type ArchivedGameRecord } from './OpenFront/Schema/ArchivedGameResponse.ts';
import { Client } from 'minio';

export class ReplayStorage {
  public constructor(
    private readonly client: Client,
    private readonly bucket: string,
  ) {}

  public async save(id: string, replay: ArchivedGameRecord) {
    const json = JSON.stringify(replay, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
    const compressed = await Bun.zstdCompress(json, { level: 17 });

    await this.client.putObject(this.bucket, this.filename(replay.gitCommit, id), compressed, compressed.length, {
      'Content-Type': 'application/json',
      'Content-Encoding': 'zstd',
    });
  }

  private filename(commit: string, id: string) {
    return `${commit.slice(0, 7)}/${id}.json.zst`;
  }
}
