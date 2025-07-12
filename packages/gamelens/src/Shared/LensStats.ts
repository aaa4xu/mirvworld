export interface LensStats {
  /* Event version */
  version: '2';
  /* Match ID */
  id: string;
  /* Game commit on which the match was played */
  commit: string;
  /* Game mode */
  mode: string;
  /* Map */
  map: string;
  /* Start time in ms */
  startedAt: number;
  /* End time in ms */
  finishedAt: number;
  /* Human players */
  players: LensStatsPlayer[];
  /* Player ID -> stats for each game step */
  turns: Record<string, LensStatsPlayerTurn>[];
  /* Winner */
  winner: [type: 'player' | 'team', id: string];
}

export interface LensStatsPlayer {
  /* Player ID in this match */
  id: string;
  /* Nickname */
  name: string;
  /* Team */
  team: string | null;
  /* Coordinates where player spawned */
  spawn?: [x: number, y: number];
}

export interface LensStatsPlayerTurn {
  territory: number;
  troops: number;
  workers: number;
}
