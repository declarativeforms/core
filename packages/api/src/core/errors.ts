export class HttpError extends Error {
  public statusCode: number;
  public payload: Record<string, unknown> | null;

  constructor(
    statusCode: number,
    message: string,
    payload: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.payload = payload;
  }

  public static forbidden(): HttpError {
    return new HttpError(403, 'forbidden');
  }

  public static conflict(error: string): HttpError {
    return new HttpError(409, error, { error });
  }

  public static invalid(errors: Record<string, string>): HttpError {
    return new HttpError(422, 'invalid', { errors });
  }
}
