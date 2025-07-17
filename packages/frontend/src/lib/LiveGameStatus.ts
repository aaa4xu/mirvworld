export interface LiveGameStatus {
  id: string;
  map: string;
  mode: string;
  players: number;
  maxPlayers?: number;
  startedAt: number;
}
