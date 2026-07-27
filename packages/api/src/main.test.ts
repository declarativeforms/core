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

  test('protects form management without connecting to the database', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/forms',
      payload: {},
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'A valid management API key is required.',
      },
    });

    await server.close();
  });

  test('requires the API key to use the Bearer scheme', async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/forms',
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
