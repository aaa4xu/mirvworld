export class HttpError extends Error {
  public constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
