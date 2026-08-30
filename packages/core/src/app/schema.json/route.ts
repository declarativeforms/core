import { buildFormJsonSchema } from '@/lib/form-schema';

// Prerendered at build time: the schema assertions become build failures, and
// no filesystem read happens at runtime.
export const dynamic = 'force-static';

export function GET() {
  return new Response(buildFormJsonSchema(), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
