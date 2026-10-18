import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import Ajv from 'ajv';
import {
  FORM_JSON_SCHEMA,
  assertJsonSchemaCoverage,
  parse,
  resolve,
  serialize,
  toRenderableForm,
  validateField,
} from '@declarativeforms/engine';
import { GET } from './src/app/schema.json/route.ts';

test('favicon and social preview URLs validate and survive YAML and resolution', () => {
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);

  for (const theme of [
    undefined,
    {},
    { icon: 'https://example.com/favicon.png' },
  ]) {
    for (const open_graph of [
      undefined,
      {},
      { image: 'https://example.com/social-preview.png' },
    ]) {
      const definition = {
        theme,
        open_graph,
        sections: [{ id: 'details', fields: [] }],
      };
      assert.equal(validate(definition), true, JSON.stringify(validate.errors));
      const parsed = parse(serialize(definition));
      const resolved = resolve(parsed, 'en');
      assert.deepEqual(parsed.theme, theme);
      assert.deepEqual(parsed.open_graph, open_graph);
      assert.deepEqual(resolved.theme, theme);
      assert.deepEqual(resolved.open_graph, open_graph);
      assert.deepEqual(
        toRenderableForm(serialize(definition), { locale: 'en' }).theme,
        theme,
      );
    }
  }

  for (const url of [
    '',
    '/image.png',
    'http://example.com/image.png',
    'https://',
    'https://example.com/bad path',
    'data:image/png;base64,a',
    'javascript:alert(1)',
    null,
    42,
    { en: 'https://example.com/image.png' },
  ]) {
    for (const settings of [
      { theme: { icon: url } },
      { open_graph: { image: url } },
    ]) {
      assert.equal(
        validate({ ...settings, sections: [{ id: 'details', fields: [] }] }),
        false,
        JSON.stringify(settings),
      );
    }
  }

  for (const settings of [
    { openGraph: { image: 'https://example.com/image.png' } },
    { open_graph: { unknown: true } },
    { theme: { unknown: true } },
    { open_graph: null },
    { open_graph: 'https://example.com/image.png' },
  ]) {
    assert.equal(
      validate({ ...settings, sections: [{ id: 'details', fields: [] }] }),
      false,
      JSON.stringify(settings),
    );
  }
});

test('theme modes validate and survive YAML and the rendering pipeline', () => {
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);

  for (const mode of [undefined, 'light', 'dark', 'auto']) {
    const theme = {
      ...(mode === undefined ? {} : { mode }),
      primary: '#542EBC',
      logo: 'https://example.com/logo.svg',
    };
    const definition = { theme, sections: [{ id: 'details', fields: [] }] };
    assert.equal(validate(definition), true, JSON.stringify(validate.errors));
    const yaml = serialize(definition);
    assert.deepEqual(parse(yaml).theme, theme);
    assert.deepEqual(toRenderableForm(yaml, { locale: 'en' }).theme, theme);
  }

  for (const mode of ['system', '', null, true, 1]) {
    assert.equal(
      validate({
        theme: { mode },
        sections: [{ id: 'details', fields: [] }],
      }),
      false,
    );
  }

  assert.equal(
    toRenderableForm('sections: [{id: details, fields: []}]', {
      locale: 'en',
    }).theme,
    undefined,
  );
});

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
  assert.equal(
    validate({
      ...form,
      authentication: {
        verifier: 'a'.repeat(64),
      },
    }),
    true,
    JSON.stringify(validate.errors),
  );
  for (const invalid of [
    { ...form, unsupported: true },
    { ...form, sections: [] },
    { ...form, id: 'authored_id' },
    {
      ...form,
      authentication: {
        verifier: 'not-a-verifier',
      },
    },
    {
      ...form,
      authentication: {
        access_key: 'must-not-be-published',
        verifier: 'a'.repeat(64),
      },
    },
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

test('checkbox fields preserve booleans and require explicit acceptance', () => {
  const definition = {
    sections: [
      {
        id: 'agreement',
        fields: [
          {
            id: 'consent',
            type: 'checkbox',
            label: {
              en: 'Accept for {{data.name}}',
              de: 'Zustimmen für {{data.name}}',
            },
            helper_text: { en: 'Read the terms.', de: 'Bedingungen lesen.' },
            validators: [
              {
                type: 'required',
                message: { en: 'Please accept.', de: 'Bitte zustimmen.' },
              },
            ],
          },
          { id: 'flexible', type: 'checkbox', label: 'Flexible' },
          {
            id: 'conditional',
            type: 'checkbox',
            label: 'Conditional',
            visible_when: 'data.consent === true',
          },
        ],
      },
    ],
  };
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);
  assert.equal(validate(definition), true, JSON.stringify(validate.errors));
  for (const extra of [{ options: ['Accept'] }, { allow_other: true }]) {
    const invalid = structuredClone(definition);
    Object.assign(invalid.sections[0].fields[0], extra);
    assert.equal(validate(invalid), false);
  }

  const yaml = JSON.stringify(definition);
  const form = toRenderableForm(yaml, { locale: 'de', data: { name: 'Ada' } });
  const consent = form.section.fields[0];
  assert.equal(consent.type, 'checkbox');
  assert.equal(consent.label, 'Zustimmen für Ada');
  assert.equal(consent.helperText, 'Bedingungen lesen.');
  assert.equal(consent.required, true);
  assert.equal(form.section.fields[1].required, false);
  assert.equal(form.section.fields[2].visible, false);
  assert.deepEqual(form.section.defaultValues, {
    consent: false,
    flexible: false,
    conditional: false,
  });
  for (const value of [
    false,
    undefined,
    null,
    '',
    'true',
    'false',
    [],
    ['accepted'],
    1,
  ]) {
    assert.equal(
      validateField(consent, value, { consent: value }),
      'Bitte zustimmen.',
    );
  }
  assert.equal(validateField(consent, true, { consent: true }), undefined);
  for (const value of [false, true]) {
    assert.equal(validateField(form.section.fields[1], value, {}), undefined);
    const restored = toRenderableForm(yaml, {
      locale: 'en',
      data: { consent: value, flexible: value },
    });
    assert.equal(restored.section.defaultValues.consent, value);
    assert.equal(restored.section.defaultValues.flexible, value);
    assert.equal(restored.section.fields[2].visible, value);
  }
  const validation = [{ type: 'required', message: 'Required' }];
  assert.equal(validateField({ validation }, false, {}), undefined);
  assert.equal(
    validateField({ type: 'multiple_select', validation }, ['accepted'], {}),
    undefined,
  );
  assert.equal(
    validateField({ type: 'multiple_select', validation }, [], {}),
    'Required',
  );
});

test('field helper text is localized and templated', () => {
  const form = toRenderableForm(
    `
version: 1
sections:
  - id: details
    fields:
      - id: name
        type: short_text
        label: Name
        helper_text:
          en: Help for {{data.audience}}.
          de: Hilfe für {{data.audience}}.
      - id: plain
        type: short_text
        label: Plain
`,
    { locale: 'de', data: { audience: 'Ada' } },
  );

  assert.equal(form.section.fields[0].helperText, 'Hilfe für Ada.');
  assert.equal(form.section.fields[1].helperText, undefined);
});

test('section buttons accept localized templates and preserve navigation and defaults', () => {
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);

  for (const [button, locale, expected] of [
    ['Send details', 'en', 'Send details'],
    ['Continue, {{data.name}}', 'en', 'Continue, Ada'],
    [{ en: 'Continue', de: 'Weiter, {{data.name}}' }, 'de', 'Weiter, Ada'],
    [{ en: 'Continue' }, 'de', 'Continue'],
    ['', 'en', undefined],
    [{ en: '' }, 'en', undefined],
    [undefined, 'en', undefined],
  ]) {
    const definition = {
      sections: [
        { id: 'contact', button, fields: [], next: 'preferences' },
        { id: 'preferences', fields: [] },
      ],
    };
    assert.equal(validate(definition), true, JSON.stringify(validate.errors));
    const form = toRenderableForm(JSON.stringify(definition), {
      locale,
      data: { name: 'Ada' },
    });

    assert.equal(form.section.button, expected);
    assert.deepEqual(form.section.next, {
      type: 'section',
      sectionId: 'preferences',
    });
  }

  for (const button of [42, null, ['Continue'], { en: 42 }]) {
    assert.equal(
      validate({ sections: [{ id: 'contact', button, fields: [] }] }),
      false,
    );
  }
});


test('logo objects validate bounds and survive the rendering pipeline', () => {
  const validate = new Ajv({ allErrors: true }).compile(FORM_JSON_SCHEMA);
  for (const logo of [
    'https://example.com/logo.png',
    ...[undefined, 32, 56, 80, 120].map(height => ({ image: 'https://example.com/logo.png', ...(height === undefined ? {} : { height }) })),
  ]) {
    const theme = { logo };
    const definition = { theme, sections: [{ id: 'details', fields: [] }] };
    assert.equal(validate(definition), true, JSON.stringify(validate.errors));
    assert.deepEqual(toRenderableForm(serialize(definition), { locale: 'en' }).theme, theme);
  }
  for (const logo of [
    {}, null,
    { image: '/logo.png' }, { image: 'http://example.com/logo.png' },
    { image: 'https://example.com/logo.png', unknown: true },
    ...[31, 121, 80.5, '80', null, true].map(height => ({ image: 'https://example.com/logo.png', height })),
  ]) {
    assert.equal(validate({ theme: { logo }, sections: [{ id: 'details', fields: [] }] }), false);
  }
  assert.equal(validate({ theme: { logo_height: 80 }, sections: [{ id: 'details', fields: [] }] }), false);
});
