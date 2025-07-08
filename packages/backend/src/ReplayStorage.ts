import path from 'node:path';
import { ReplayFile } from './ReplayFile.ts';

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
}
