import type { ISubmission } from '@declarativeforms/engine';
import fastify from 'fastify';
import { getContainer } from '../core';
import { FORMS_ID_SUBMISSIONS_GET } from './forms-id-submissions-get';

jest.mock('../core', () => ({ getContainer: jest.fn() }));

test('validates and authorizes submission listing requests', async () => {
  const list =
    jest.fn<
      (
        formId: string,
        accessKey: string,
        page: number,
        limit: number,
      ) => Promise<Array<ISubmission> | null>
    >();
  jest.mocked(getContainer).mockResolvedValue({
    submissionService: { list },
  } as unknown as Awaited<ReturnType<typeof getContainer>>);

  const server = fastify();
  server.route(FORMS_ID_SUBMISSIONS_GET);

  list.mockResolvedValueOnce(null);
  const unauthorized = await server.inject(
    '/api/v1/forms/a12345678/submissions',
  );
  expect(unauthorized.statusCode).toBe(404);
  expect(unauthorized.headers['cache-control']).toBe('no-store');
  expect(list).toHaveBeenLastCalledWith('a12345678', '', 1, 100);

  list.mockResolvedValueOnce([]);
  const authorized = await server.inject({
    headers: { authorization: 'bEaReR access-key' },
    method: 'GET',
    url: '/api/v1/forms/a12345678/submissions?page=2&limit=50',
  });
  expect(authorized.statusCode).toBe(200);
  expect(authorized.json()).toEqual([]);
  expect(list).toHaveBeenLastCalledWith('a12345678', 'access-key', 2, 50);

  list.mockClear();

  for (const query of [
    'page=0',
    'page=1.5',
    'page=18014398509482',
    'limit=501',
  ]) {
    const invalid = await server.inject(
      `/api/v1/forms/a12345678/submissions?${query}`,
    );
    expect(invalid.statusCode).toBe(400);
  }

  expect(list).not.toHaveBeenCalled();
  await server.close();
});
