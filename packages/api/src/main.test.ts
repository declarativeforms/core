import { buildServer } from './server';

describe('API surface', () => {
  const originalApiKey = process.env.API_KEY;

  beforeEach(() => {
    process.env.API_KEY = 'test-api-key';
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalApiKey;
    }
  });

  test('exposes a JSON health check', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });

    await server.close();
  });

  test('does not expose database-managed form definitions', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/forms',
      payload: {},
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');

    await server.close();
  });

  test('protects submission reads with the Bearer API key', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/forms/g.invalid/submissions',
      headers: {
        authorization: 'test-api-key',
      },
    });

    expect(response.statusCode).toBe(401);

    await server.close();
  });

  test('does not expose the removed Studio API', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/studio/forms',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');

    await server.close();
  });
});
