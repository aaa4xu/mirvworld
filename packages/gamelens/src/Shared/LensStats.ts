export interface LensStats {
  /* Event version */
  version: "1";
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
  /* Statistics for each game step */
  turns: LensStatsTurn[];
}

export interface LensStatsPlayer {
  /* Player ID in this match */
  id: string;
  /* Nickname */
  name: string;
  /* Team */
  team: string | null;
  /* Coordinates where player spawned */
  spawn?: [number, number];
}

export interface LensStatsTurn {
  /* Player ID -> number of tiles owned */
  territory: Record<string, number>;
}
