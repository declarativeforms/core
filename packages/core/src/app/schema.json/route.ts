import { buildFormJsonSchema } from '@/lib/form-schema';

export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildFormJsonSchema(), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
