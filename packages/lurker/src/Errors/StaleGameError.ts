export class StaleGameError extends Error {
  public constructor() {
    super('Stale game');
    this.name = 'StaleGameError';
  }
}
