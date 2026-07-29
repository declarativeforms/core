import {
  compileFormView,
  createRuntimeState,
  FormYamlParseError,
  evaluateExpression,
  parseFormYaml,
  transitionRuntime,
  validateFieldValue,
  validateFormData,
  validateFormDefinition,
  type FormDefinition,
} from './index';

const definition: FormDefinition = {
  title: { en: 'Welcome, {{data.name}}', de: 'Hallo, {{data.name}}' },
  sections: [
    {
      id: 'start',
      title: 'Start',
      fields: [
        {
          id: 'name',
          type: 'short_text',
          label: 'Name',
          validators: ['required'],
        },
      ],
      next: [{ when: "data.name === 'Ada'", go: 'details' }, { else: 'done' }],
    },
    {
      id: 'details',
      title: 'Details',
      fields: [{ id: 'notes', type: 'long_text', label: 'Notes' }],
      next: 'done',
    },
  ],
};

test('parses YAML and validates the definition', () => {
  const parsed = parseFormYaml(`
title: Contact
sections:
  - id: contact
    fields:
      - id: email
        type: email
`);

  expect(parsed.title).toBe('Contact');
  expect(validateFormDefinition(parsed)).toEqual([]);
});

test('keeps unquoted YAML timestamps as schema-compatible strings', () => {
  const parsed = parseFormYaml(`
start_date: 2026-01-01T00:00:00Z
sections:
  - id: contact
    fields: []
`);

  expect(parsed.start_date).toBe('2026-01-01T00:00:00Z');
  expect(validateFormDefinition(parsed)).toEqual([]);
});

test('reports YAML syntax locations and rejects unknown schema keys', () => {
  expect(() =>
    parseFormYaml(`
sections:
  - id: contact
    fields: [
`),
  ).toThrow(FormYamlParseError);

  try {
    parseFormYaml('sections:\n  - fields: [');
  } catch (error) {
    expect(error).toMatchObject({
      name: 'FormYamlParseError',
      line: 3,
      column: 1,
    });
  }

  expect(
    validateFormDefinition({
      sections: [
        {
          id: 'contact',
          fields: [
            {
              id: 'email',
              type: 'email',
              placehoder: 'name@example.com',
            },
          ],
        },
      ],
    }),
  ).toContain('sections[0].fields[0].placehoder is not supported');
});

test('compiles only the requested section into the view', () => {
  const view = compileFormView(definition, 'en', { name: 'Ada' }, 'details');

  expect(view.title).toBe('Welcome, Ada');
  expect(view.section.id).toBe('details');
  expect(view.section.fields).toHaveLength(1);
  expect('sections' in view).toBe(false);
});

test('transitions between sections using safe expressions', () => {
  const state = createRuntimeState(definition, 'en', {});
  const result = transitionRuntime(definition, 'en', state, {
    type: 'submit_section',
    data: { name: 'Ada' },
  });

  expect(result.effect).toEqual({
    type: 'submit',
    data: { name: 'Ada' },
    isPartial: true,
  });
  expect(result.state.view.section.id).toBe('details');
});

test('returns to the previous section without losing form data', () => {
  const initial = createRuntimeState(definition, 'en', {});
  const next = transitionRuntime(definition, 'en', initial, {
    type: 'submit_section',
    data: { name: 'Ada' },
  });
  const previous = transitionRuntime(definition, 'en', next.state, {
    type: 'go_back',
  });

  expect(previous.state.view.section.id).toBe('start');
  expect(previous.state.data).toEqual({ name: 'Ada' });
});

test('completes when no next section matches', () => {
  const initial = createRuntimeState(definition, 'en', {});
  const result = transitionRuntime(definition, 'en', initial, {
    type: 'submit_section',
    data: { name: 'Grace' },
  });

  expect(result.effect).toEqual({
    type: 'complete',
    data: { name: 'Grace' },
  });
});

test('keeps the active section and reports validation errors', () => {
  const initial = createRuntimeState(definition, 'en', {});
  const result = transitionRuntime(definition, 'en', initial, {
    type: 'submit_section',
    data: { name: '' },
  });

  expect(result.effect).toEqual({ type: 'none' });
  expect(result.state.view.section.id).toBe('start');
  expect(result.state.validationErrors.name).toBeDefined();
});

test('does not execute calls or arbitrary JavaScript', () => {
  const data = { rating: 2, category: 'urgent' };

  expect(
    evaluateExpression("data.rating <= 2 && data.category === 'urgent'", data),
  ).toBe(true);
  expect(evaluateExpression('process.exit()', data)).toBe(false);
  expect(
    evaluateExpression(
      'data.constructor.constructor("return process")()',
      data,
    ),
  ).toBe(false);
});

test('treats an empty selection as missing when it is required', () => {
  expect(
    validateFieldValue(
      'multiple_select',
      [],
      [{ type: 'required', message: 'Choose one' }],
      {},
    ),
  ).toBe('Choose one');
});

test('returns path-oriented errors for malformed nested definitions', () => {
  expect(() =>
    validateFormDefinition({ sections: 'not-an-array' }),
  ).not.toThrow();
  expect(validateFormDefinition({ sections: 'not-an-array' })).toContain(
    'sections must be an array',
  );

  const errors = validateFormDefinition({
    sections: [
      {
        id: 'start',
        fields: [
          {
            id: 'choice',
            type: 'single_select',
            options: ['same', 'same'],
            validators: [
              { type: 'pattern', regex: '(a+)+$', message: 'Unsafe' },
            ],
          },
        ],
        next: [{ else: 'done' }, { when: 'data.choice', go: 'done' }],
      },
    ],
  });

  expect(errors).toEqual(
    expect.arrayContaining([
      'sections[0].fields[0].options[1].value must be unique',
      'sections[0].fields[0].validators[0].regex uses an unsafe or overly complex pattern',
      'sections[0].next[0] else rule must be last',
    ]),
  );
});

test('validates completed and partial API data and drops unknown fields', () => {
  const schema: FormDefinition = {
    start_date: '2025-01-01T00:00:00.000Z',
    sections: [
      {
        id: 'contact',
        fields: [
          {
            id: 'email',
            type: 'email',
            label: 'Email',
            validators: ['required'],
          },
          {
            id: 'plan',
            type: 'single_select',
            label: 'Plan',
            options: ['basic', 'pro'],
          },
        ],
        next: 'done',
      },
    ],
  };

  const completed = validateFormData(
    schema,
    'en',
    { email: 'invalid', plan: 'enterprise', injected: 'drop me' },
    { now: new Date('2026-01-01T00:00:00.000Z') },
  );
  expect(completed.data).not.toHaveProperty('injected');
  expect(completed.errors).toMatchObject({
    email: 'Email must be a valid email address.',
    plan: 'Plan contains an invalid option.',
  });

  const partial = validateFormData(
    schema,
    'en',
    { email: 'invalid' },
    { partial: true },
  );
  expect(partial.errors.email).toBe('Email must be a valid email address.');
  expect(partial.errors).not.toHaveProperty('plan');
});

test('removes hidden answers and reconstructs history when resuming', () => {
  const schema: FormDefinition = {
    sections: [
      {
        id: 'start',
        fields: [
          { id: 'show_details', type: 'short_text', label: 'Show details' },
          {
            id: 'secret',
            type: 'short_text',
            label: 'Secret',
            visible_when: "data.show_details === 'yes'",
          },
        ],
        next: 'details',
      },
      {
        id: 'details',
        fields: [{ id: 'notes', type: 'long_text', label: 'Notes' }],
        next: 'done',
      },
    ],
  };

  const initial = createRuntimeState(schema, 'en', {
    show_details: 'yes',
    secret: 'remove me',
  });
  const updated = transitionRuntime(schema, 'en', initial, {
    type: 'update_field',
    fieldId: 'show_details',
    value: 'no',
  });
  expect(updated.state.data).not.toHaveProperty('secret');

  const resumed = createRuntimeState(
    schema,
    'en',
    { show_details: 'no' },
    'details',
  );
  expect(resumed.sectionHistory).toEqual(['start']);
});
