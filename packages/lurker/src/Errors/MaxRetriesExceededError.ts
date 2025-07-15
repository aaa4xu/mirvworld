import { GameConnectionError } from './GameConnectionError.ts';

export class MaxRetriesExceededError extends GameConnectionError {
  public constructor(public readonly attempts: number) {
    super('Max retries exceeded');
    this.name = 'MaxRetriesExceededError';
  }
}
