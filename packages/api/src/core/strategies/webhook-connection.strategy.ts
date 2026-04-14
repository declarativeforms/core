import type { ISubmission, IWebhookConnection } from '@declarativeforms/types';

export class WebhookConnectionStrategy {
  readonly type = 'webhook';

  async handle(
    connection: IWebhookConnection,
    submission: ISubmission,
  ): Promise<void> {
    if (!connection.url) {
      return;
    }

    await fetch(connection.url, {
      body: JSON.stringify(submission),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }
}
