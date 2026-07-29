import type { ISubmission } from '@declarativeforms/core';
import { WebhookConnectionStrategy } from './webhook-connection.strategy';

const submission: ISubmission = {
  created_at: '2026-01-01T00:00:00.000Z',
  data: {},
  form_id: 'f123456789abc',
  id: 'submission-id',
  metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
  status: 'completed',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('WebhookConnectionStrategy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    'http://example.com/hook',
    'https://127.0.0.1/hook',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/hook',
  ])('rejects unsafe destination %s', async (url) => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    await expect(
      new WebhookConnectionStrategy().handle(
        { type: 'webhook', url },
        submission,
      ),
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('revalidates redirect destinations and rejects loopback', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        headers: { location: 'https://127.0.0.1/private' },
        status: 302,
      }),
    );

    await expect(
      new WebhookConnectionStrategy().handle(
        { type: 'webhook', url: 'https://8.8.8.8/hook' },
        submission,
      ),
    ).rejects.toThrow('public addresses');
  });

  test('treats non-success status as a delivery failure', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      new WebhookConnectionStrategy().handle(
        { type: 'webhook', url: 'https://8.8.8.8/hook' },
        submission,
      ),
    ).rejects.toThrow('HTTP 503');
  });
});
