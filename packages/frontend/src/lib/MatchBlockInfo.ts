export interface MatchBlockInfo {
  id: string;
  map: string;
  mode: string;
  players: number;
  maxPlayers?: number;
  startedAt: Date;
  finishedAt: Date;
  winner: string;
}
