import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import Ajv from 'ajv';
import {
  FORM_JSON_SCHEMA,
  assertJsonSchemaCoverage,
  parse,
} from '@declarativeforms/engine';
import { GET } from './src/app/schema.json/route.ts';

test('authoring schema covers the engine, accepts examples, and rejects mistakes', async () => {
  assertJsonSchemaCoverage();
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
  assert.deepEqual(await response.json(), FORM_JSON_SCHEMA);
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);
  const examples = new URL('../../examples/', import.meta.url);
  const entries = await readdir(examples, { recursive: true });

  for (const file of entries.filter((entry) => entry.endsWith('.yaml'))) {
    const form = parse(await readFile(new URL(file, examples), 'utf8'));
    assert.equal(
      validate(form),
      true,
      `${file}: ${JSON.stringify(validate.errors)}`,
    );
  }

  const form = parse(
    await readFile(new URL('lunch-rsvp.yaml', examples), 'utf8'),
  );
  for (const invalid of [
    { ...form, unsupported: true },
    { ...form, sections: [] },
    { ...form, id: 'authored_id' },
    {
      sections: [
        { id: 'rsvp', fields: [{ id: 'answer', type: 'unsupported' }] },
      ],
    },
    {
      sections: [
        {
          id: 'rsvp',
          fields: [
            { id: 'answer', type: 'short_text', placeholder_typo: 'Name' },
          ],
        },
      ],
    },
    {
      sections: [
        {
          id: 'rsvp',
          fields: [
            {
              id: 'answer',
              type: 'short_text',
              validators: [{ type: 'unknown' }],
            },
          ],
        },
      ],
    },
    {
      sections: [
        { id: 'rsvp', fields: [{ id: 'bad-id', type: 'short_text' }] },
      ],
    },
  ]) {
    assert.equal(validate(invalid), false, JSON.stringify(invalid));
  }
});
