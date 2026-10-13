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
