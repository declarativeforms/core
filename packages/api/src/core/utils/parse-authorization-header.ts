export function parseAuthorizationHeader(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;

  return token || null;
}
