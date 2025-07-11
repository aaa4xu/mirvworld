export class LensStats {
  public readonly players: Map<string, LetsStatsPlayerInfo> = new Map();
  public playbackDuration = 0;
  public gameTicks = 0;

  public addPlayer(player: LetsStatsPlayerInfo) {
    console.log(`New player: ${player.name} (${player.id})`);
    this.players.set(player.id, player);
    return this;
  }

  public setPlaybackDuration(duration: number) {
    this.playbackDuration = duration;
    return this;
  }

  public setGameTicks(ticks: number) {
    this.gameTicks = ticks;
    return this;
  }
}

export interface LetsStatsPlayerInfo {
  id: string;
  name: string;
}
