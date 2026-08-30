// The Compose healthcheck polls this, and `compose up --wait` gates on it.
export const dynamic = 'force-static';

export function GET() {
  return new Response('ok\n', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
