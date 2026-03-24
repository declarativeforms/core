import { evaluateExpression } from '@declarativeforms/common';
import { isDeclarativeConnectionType } from '@declarativeforms/types';
import type { IDeclarativeForm, ISubmission } from '@declarativeforms/types';
import { handleAirtable } from './airtable';
import { handleEmail } from './email';
import { handleWebhook } from './webhook';

export async function processConnections(
  form: IDeclarativeForm,
  submission: ISubmission,
): Promise<void> {
  if (!form.connections || form.connections.length === 0) {
    return;
  }

  for (const connection of form.connections) {
    if (!isDeclarativeConnectionType(connection.type)) {
      continue;
    }

    if (connection.when && !evaluateExpression(connection.when, submission.data)) {
      continue;
    }

    switch (connection.type) {
      case 'webhook':
        await handleWebhook(connection, submission);
        break;
      case 'airtable':
        await handleAirtable(connection, submission);
        break;
      case 'email':
        await handleEmail(connection, submission, form);
        break;
    }
  }
}
