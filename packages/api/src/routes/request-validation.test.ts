import fastify from 'fastify';
import { getContainer } from '../core';
import { FILES_KEY_GET } from './files-key-get';
import { FORMS_ID_EMAIL_CHALLENGES_POST } from './forms-id-email-challenges-post';
import { FORMS_ID_EMAIL_CHALLENGES_VERIFY_POST } from './forms-id-email-challenges-verify-post';
import { FORMS_ID_SUBMISSIONS_POST } from './forms-id-submissions-post';
import { FORMS_ID_TURNSTILE_VERIFY_POST } from './forms-id-turnstile-verify-post';
import { FORMS_OWNER_REPOSITORY_SLUG_GET } from './forms-owner-repository-slug-get';

jest.mock('../core', () => ({ getContainer: jest.fn() }));

test('validates route inputs before invoking application services', async () => {
  const server = fastify();
  await server.addContentTypeParser(
    '*',
    { parseAs: 'buffer' },
    (_request, payload, done) => {
      done(null, payload);
    },
  );
  server.route(FILES_KEY_GET);
  server.route(FORMS_ID_EMAIL_CHALLENGES_POST);
  server.route(FORMS_ID_EMAIL_CHALLENGES_VERIFY_POST);
  server.route(FORMS_ID_SUBMISSIONS_POST);
  server.route(FORMS_ID_TURNSTILE_VERIFY_POST);
  server.route(FORMS_OWNER_REPOSITORY_SLUG_GET);

  for (const request of [
    { method: 'GET' as const, url: '/api/v1/files/' },
    {
      method: 'POST' as const,
      payload: { email_address: 'invalid', field_id: 'email' },
      url: '/api/v1/forms/a12345678/email-challenges',
    },
    {
      method: 'POST' as const,
      payload: {
        challenge: 'challenge',
        code: '12345',
        email_address: 'user@example.com',
        field_id: 'email',
      },
      url: '/api/v1/forms/a12345678/email-challenges/verify',
    },
    {
      method: 'POST' as const,
      payload: [],
      url: '/api/v1/forms/a12345678/submissions',
    },
    {
      headers: { 'content-type': 'application/octet-stream' },
      method: 'POST' as const,
      payload: Buffer.from('not-json'),
      url: '/api/v1/forms/a12345678/submissions',
    },
    {
      method: 'POST' as const,
      payload: { field_id: 'captcha', response: '' },
      url: '/api/v1/forms/a12345678/turnstile/verify',
    },
    {
      method: 'GET' as const,
      url: '/api/v1/forms/owner/repository/',
    },
  ]) {
    const response = await server.inject(request);
    expect(response.statusCode).toBe(400);
  }

  expect(getContainer).not.toHaveBeenCalled();

  const download = jest.fn().mockResolvedValue(null);
  const requestChallenge = jest.fn().mockResolvedValue('challenge');
  const verifyEmail = jest.fn().mockReturnValue('token');
  const submit = jest.fn().mockResolvedValue(null);
  const findById = jest.fn().mockResolvedValue(null);
  const findBySlug = jest.fn().mockResolvedValue(null);
  const verifyTurnstile = jest.fn().mockResolvedValue('token');
  jest.mocked(getContainer).mockResolvedValue({
    emailVerificationService: {
      isConfigured: () => true,
      requestChallenge,
      verify: verifyEmail,
    },
    fileService: { download },
    formService: { findById, findBySlug },
    submissionService: { submit },
    turnstileVerificationService: {
      isConfigured: () => true,
      verify: verifyTurnstile,
    },
  } as unknown as Awaited<ReturnType<typeof getContainer>>);

  expect((await server.inject('/api/v1/files/key')).statusCode).toBe(404);
  expect(download).toHaveBeenLastCalledWith('key');

  const challenge = await server.inject({
    method: 'POST',
    payload: { email_address: ' user@example.com ', field_id: 'email' },
    url: '/api/v1/forms/a12345678/email-challenges',
  });
  expect(challenge.statusCode).toBe(200);
  expect(requestChallenge).toHaveBeenLastCalledWith(
    'a12345678',
    'email',
    ' user@example.com ',
  );

  const verification = await server.inject({
    method: 'POST',
    payload: {
      challenge: 'challenge',
      code: '123456',
      email_address: 'user@example.com',
      field_id: 'email',
    },
    url: '/api/v1/forms/a12345678/email-challenges/verify',
  });
  expect(verification.statusCode).toBe(200);
  expect(verifyEmail).toHaveBeenCalled();

  await server.inject({
    method: 'POST',
    payload: { answer: 'yes' },
    url: '/api/v1/forms/a12345678/submissions',
  });
  expect(submit).toHaveBeenLastCalledWith(
    'a12345678',
    { answer: 'yes' },
    false,
    expect.any(Object),
    undefined,
  );

  await server.inject({
    method: 'POST',
    payload: { answer: 'yes' },
    url: '/api/v1/forms/a12345678/submissions?id=submission&partial=true',
  });
  expect(submit).toHaveBeenLastCalledWith(
    'a12345678',
    { answer: 'yes' },
    true,
    expect.any(Object),
    'submission',
  );

  expect(
    (
      await server.inject({
        method: 'POST',
        payload: { field_id: 'captcha', response: 'response' },
        url: '/api/v1/forms/a12345678/turnstile/verify',
      })
    ).statusCode,
  ).toBe(404);
  expect(findById).toHaveBeenCalledWith('a12345678');

  expect(
    (
      await server.inject(
        '/api/v1/forms/owner/repository/forms/contact?branch=feature',
      )
    ).statusCode,
  ).toBe(404);
  expect(findBySlug).toHaveBeenLastCalledWith(
    'forms/owner/repository/forms/contact',
    'feature',
  );

  await server.close();
});
