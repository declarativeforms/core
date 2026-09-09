export class TurnstileGateway {
  public isConfigured(): boolean {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }

  public async verify(token: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          body: JSON.stringify({
            response: token,
            secret: process.env.TURNSTILE_SECRET_KEY,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!response.ok) {
        return false;
      }

      const payload: unknown = await response.json();

      return (
        typeof payload === 'object' &&
        payload !== null &&
        'success' in payload &&
        payload.success === true
      );
    } catch (error) {
      if (
        error instanceof TypeError ||
        error instanceof SyntaxError ||
        (error instanceof DOMException &&
          (error.name === 'TimeoutError' || error.name === 'AbortError'))
      ) {
        return false;
      }

      throw error;
    }
  }
}
