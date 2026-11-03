import { isWebhookAllowed } from '../../mcp/forms';
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
    form: IDeclarativeForm,
    sectionId?: string,
  ): Promise<void> {
    if (!connection.url) {
      return;
    }

    if (form.id?.startsWith('m_') && !isWebhookAllowed(connection.url)) {
      throw new Error('Webhook destination is not approved for MCP forms');
    }

    await fetch(connection.url, {
      ...(form.id?.startsWith('m_') ? { redirect: 'error' as const } : {}),
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
