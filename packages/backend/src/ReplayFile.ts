import type { ArchivedGameRecord } from './Schema/ArchivedGameResponse.ts';

export class ReplayFile {
  public constructor(private readonly replay: ArchivedGameRecord) {}

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

  public get startedAt() {
    return this.replay.info.start;
  }
}
