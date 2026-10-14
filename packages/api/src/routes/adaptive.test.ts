import fastify from 'fastify';
import { getContainer } from '../core';
import { FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST } from './forms-id-sections-section-id-adaptive';

jest.mock('../core', () => ({ getContainer: jest.fn() }));

test('rejects malformed adaptive requests before calling services', async () => {
  const server = fastify();
  server.route(FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST);
  for (const body of [
    [],
    {},
    { locale: 'en', data: {}, history: {} },
    { locale: 'en', data: {}, history: [{ answers: {} }] },
    { locale: 'en', data: {}, history: [{ fields: [], answers: [] }] },
  ]) {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/forms/a12345678/sections/adaptive/adaptive',
      payload: body,
    });
    expect(response.statusCode).toBe(400);
  }
  const missingId = await server.inject({
    method: 'GET',
    url: '/api/v1/forms/a12345678/sections/adaptive/adaptive',
  });
  expect(missingId.statusCode).toBe(404);
  expect(getContainer).not.toHaveBeenCalled();
  await server.close();
});

test('passes stateless context and history to assessment without submission metadata', async () => {
  const assess = jest
    .fn()
    .mockResolvedValue({ fields: [], outputs: { answer: 'ready' } });
  jest
    .mocked(getContainer)
    .mockResolvedValue({ adaptiveService: { assess } } as unknown as Awaited<
      ReturnType<typeof getContainer>
    >);
  const server = fastify();
  server.route(FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST);
  try {
    const body = { locale: 'en', data: { name: 'Ada' }, history: [] };
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/forms/a12345678/sections/adaptive/adaptive',
      payload: body,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json()).toEqual({
      fields: [],
      outputs: { answer: 'ready' },
    });
    expect(assess).toHaveBeenCalledWith('a12345678', 'adaptive', body);
  } finally {
    await server.close();
  }
});

test('rejects malformed history field definitions before calling services', async () => {
  jest.mocked(getContainer).mockClear();
  const server = fastify();
  server.route(FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST);
  try {
    for (const field of [
      {},
      { id: 'q', type: 'unknown' },
      { id: 'q', type: 'short_text', label: 123 },
      { id: 'q', type: 'dropdown', options: [{ label: 'Choice', value: 123 }] },
      { id: 'q', type: 'short_text', validators: [{ type: 'min_length' }] },
      {
        id: 'q',
        type: 'short_text',
        validators: [{ type: 'min_length', value: '2' }],
      },
      { id: 'q', type: 'short_text', unexpected: true },
    ]) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/forms/a12345678/sections/adaptive/adaptive',
        payload: {
          locale: 'en',
          data: {},
          history: [{ fields: [field], answers: {} }],
        },
      });
      expect(response.statusCode).toBe(400);
    }
    expect(getContainer).not.toHaveBeenCalled();
  } finally {
    await server.close();
  }
});

test('preserves history choices and validators while ignoring extra conversation properties', async () => {
  const assess = jest.fn().mockResolvedValue({ fields: [] });
  jest
    .mocked(getContainer)
    .mockResolvedValue({ adaptiveService: { assess } } as unknown as Awaited<
      ReturnType<typeof getContainer>
    >);
  const server = fastify();
  server.route(FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST);
  try {
    const fields = [
      {
        id: 'choice',
        type: 'dropdown',
        label: { en: 'Choice', es: 'Opción' },
        options: [{ label: { en: 'One', es: 'Uno' }, value: 'one' }],
        validators: [
          { type: 'required', message: { en: 'Choose', es: 'Elige' } },
        ],
      },
      {
        id: 'amount',
        type: 'number',
        validators: [
          { type: 'pattern', regex: '^-?\\d+(\\.\\d+)?$' },
          { type: 'min', value: 0 },
        ],
      },
      { id: 'email', type: 'email' },
    ];
    const body = {
      locale: 'es',
      data: { context: 'keep' },
      history: [{ fields, answers: { choice: 'one', amount: 2, email: '' } }],
    };
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/forms/a12345678/sections/adaptive/adaptive',
      payload: {
        ...body,
        extra: 'ignore',
        history: [{ ...body.history[0], extra: 'ignore' }],
      },
    });
    expect(response.statusCode).toBe(200);
    expect(assess).toHaveBeenCalledWith('a12345678', 'adaptive', body);
    expect(assess.mock.calls[0][2].history[0].fields[2]).not.toHaveProperty(
      'otp',
    );
  } finally {
    await server.close();
  }
});
