import type { GameRecord } from 'openfront-client/src/core/Schemas.ts';

export class ReplayFile {
  public static async fromFile(filepath: string) {
    if (filepath.endsWith('.gz')) {
      const decoder = new TextDecoder();
      const content = JSON.parse(decoder.decode(Bun.gunzipSync(await Bun.file(filepath).arrayBuffer())));
      return new ReplayFile(content.gameRecord);
    }

    if (filepath.endsWith('.json')) {
      const content = await Bun.file(filepath).json();
      return new ReplayFile(content.gameRecord);
    }

    throw new Error(`Unsupported file type: ${filepath}`);
  }

  public constructor(private readonly replay: GameRecord) {}

  public get mode() {
    return this.replay.info.config.gameMode;
  }

  public get id() {
    return this.replay.info.gameID;
  }

  public get duration() {
    return this.replay.info.duration * 1000;
  }

  public get map() {
    return this.replay.info.config.gameMap;
  }

  public get turns() {
    return this.replay.turns;
  }

  public get players() {
    return this.replay.info.players;
  }
}
