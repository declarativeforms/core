export const dynamic = 'force-static';

export function GET(): Response {
  return new Response('OK!\n', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
