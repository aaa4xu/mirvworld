export interface LensPlugin<GameRunner, Turn> {
  onGameStart(runner: GameRunner): void;

  onGameEnd(runner: GameRunner): void;

  onTickStart(runner: GameRunner): void;

  onTickEnd(runner: GameRunner): void;

  onTurn(turn: Turn): void;
}