import type {
  IDeclarativeForm,
  ISubmission,
  IWebhookConnection,
} from '@declarativeforms/engine';

export class WebhookConnectionStrategy {
  readonly type = 'webhook';

  public async deliver(
    connection: IWebhookConnection,
    submission: ISubmission,
    _form: IDeclarativeForm,
    sectionId?: string,
  ): Promise<void> {
    if (!connection.url) {
      return;
    }

    await fetch(connection.url, {
      body: JSON.stringify({
        ...submission,
        ...(sectionId !== undefined && { section_id: sectionId }),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  }
}
