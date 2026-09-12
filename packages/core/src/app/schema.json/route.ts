import {
  FORM_JSON_SCHEMA,
  assertJsonSchemaCoverage,
} from '@declarativeforms/engine';

export const dynamic = 'force-static';

export function GET(): Response {
  assertJsonSchemaCoverage();

  return new Response(`${JSON.stringify(FORM_JSON_SCHEMA, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
