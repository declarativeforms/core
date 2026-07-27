import {
  compileFormView,
  createRuntimeState,
  evaluateExpression,
  parseFormYaml,
  transitionRuntime,
  validateFieldValue,
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
    evaluateExpression(
      "data.rating <= 2 && data.category === 'urgent'",
      data,
    ),
  ).toBe(true);
  expect(evaluateExpression('process.exit()', data)).toBe(false);
  expect(
    evaluateExpression('data.constructor.constructor("return process")()', data),
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
