import type { ISubmission } from '@declarativeforms/engine';
import { WebhookConnectionStrategy } from './webhook-connection.strategy';

test('delivers the same section field for partial and completed webhooks', async () => {
  const fetchRequest = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({} as Response);
  const strategy = new WebhookConnectionStrategy();
  const connection = {
    type: 'webhook' as const,
    url: 'https://example.com/hook',
  };
  const submission: ISubmission = {
    created_at: '2026-09-27T00:00:00.000Z',
    data: { name: 'Ada' },
    form_id: 'a12345678',
    id: 'submission',
    metadata: { ip_address: '127.0.0.1', user_agent: 'test' },
    status: 'partial',
    updated_at: '2026-09-27T00:00:00.000Z',
  };

  try {
    await strategy.deliver(connection, submission, {}, 'contact');
    await strategy.deliver(
      connection,
      { ...submission, status: 'completed' },
      {},
      'details',
    );

    expect(JSON.parse(String(fetchRequest.mock.calls[0][1]?.body))).toEqual({
      ...submission,
      section_id: 'contact',
    });
    expect(JSON.parse(String(fetchRequest.mock.calls[1][1]?.body))).toEqual({
      ...submission,
      section_id: 'details',
      status: 'completed',
    });

    await strategy.deliver(connection, submission, {});
    expect(JSON.parse(String(fetchRequest.mock.calls[2][1]?.body))).toEqual(
      submission,
    );
  } finally {
    fetchRequest.mockRestore();
  }
});
