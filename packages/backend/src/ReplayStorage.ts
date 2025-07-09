import path from 'node:path';
import { ReplayFile } from './ReplayFile.ts';
import { type ArchivedGameRecord, ArchivedGameRecordSchema } from './Schema/ArchivedGameResponse.ts';

/**
 * ReplayStorage is a class designed to manage the saving and reading of game replay data.
 * It handles compression and decompression of replay files using `gzip` to optimize storage,
 * and validates parsed data using a schema.
 */
export class ReplayStorage {
  private readonly decoder = new TextDecoder();

  public constructor(private readonly root: string) {}

  public async read(id: string) {
    const archive = await Bun.file(this.filename(id)).bytes();
    const content = await Bun.zstdDecompress(archive);
    const json = this.decoder.decode(content);
    const replay = ArchivedGameRecordSchema.parse(JSON.parse(json));
    return new ReplayFile(replay);
  }

  public async save(id: string, replay: ArchivedGameRecord) {
    const content = JSON.stringify(replay, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
    const buffer = Bun.gzipSync(content, {
      level: 9,
    });
    await Bun.file(this.filename(id)).write(buffer);
  }

  private filename(id: string) {
    return path.join(this.root, `${id}.json.gz`);
  }
}
