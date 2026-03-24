import type { IAirtableConnection, ISubmission } from '@declarativeforms/types';
import { findConnection } from '../../repositories';

export async function handleAirtable(
  connection: IAirtableConnection,
  submission: ISubmission,
): Promise<void> {
  if (submission.status !== 'completed') {
    return;
  }

  if (
    !connection.connection_id ||
    !connection.base_id ||
    !connection.table_id_or_name
  ) {
    return;
  }

  const record = await findConnection(connection.connection_id);

  const accessToken = record?.access_token;

  if (!accessToken) {
    return;
  }

  await fetch(
    `https://api.airtable.com/v0/${connection.base_id}/${connection.table_id_or_name}`,
    {
      body: JSON.stringify({ fields: submission.data }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );
}
