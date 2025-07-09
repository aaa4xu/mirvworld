import path from 'node:path';
import { ReplayFile } from './ReplayFile.ts';
import type { GameRecord } from 'openfront-client/src/core/Schemas.ts';

export class ReplayStorage {
  public constructor(private readonly root: string) {}

  public async load(id: string) {
    const base = path.join(this.root, id);

    const jsonFilename = `${base}.json`;
    const gzJsonFilename = `${base}.json.gz`;

    if (await Bun.file(gzJsonFilename).exists()) {
      return ReplayFile.fromFile(gzJsonFilename);
    }

    if (await Bun.file(jsonFilename).exists()) {
      return ReplayFile.fromFile(jsonFilename);
    }

    throw new Error(`Replay not found: ${id}`);
  }

  public async saveFromGamesApi(id: string, gameRecord: GameRecord) {
    const filename = path.join(this.root, `${id}.json.gz`);
    const content = {
      success: true,
      exists: true,
      gameRecord,
    };
    const json = JSON.stringify(content);
    const buffer = Bun.gzipSync(Buffer.from(json));
    await Bun.file(filename).write(buffer);
  }

  public async saveFromHttp(id: string, response: Response) {
    const contentEncoding = response.headers.get('Content-Encoding');
    const contentType = response.headers.get('Content-Type')?.split(';')[0];

    if (contentType !== 'application/json') {
      throw new Error(`Replay content type must be application/json, got ${contentType}`);
    }

    switch (contentEncoding) {
      case 'gzip':
        await Bun.file(path.join(this.root, `${id}.json.gz`)).write(response);
        break;

      case null:
        await Bun.file(path.join(this.root, `${id}.json`)).write(response);
        console.log(`[ReplayLurker] Imported replay for ${id} without compression`);
        break;

      default:
        throw new Error(`Unknown replay content encoding: ${contentEncoding}`);
    }
  }
}
