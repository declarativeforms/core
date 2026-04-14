export function bufferToBase64(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;

  return buffer.toString('base64url');
}
