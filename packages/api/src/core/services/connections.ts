import { evaluateExpression, interpolateTemplate } from '@declarativeforms/common';
import { Resend } from 'resend';
import { findConnection } from '../repositories';
import type {
  IAirtableConnection,
  IDeclarativeForm,
  IEmailConnection,
  ISubmission,
  IWebhookConnection,
} from '../types';
import { isDeclarativeConnectionType, isDeclarativeFieldType } from '../types';
import { resolveLocalizedText } from './localize';

function generateResponsesHTML(
  form: IDeclarativeForm,
  data: Record<string, unknown>,
): string {
  const rows: string[] = [];

  for (const section of form.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (isDeclarativeFieldType(field.type) && field.type === 'hidden') {
        continue;
      }

      const fieldId = field.id;
      if (!fieldId || data[fieldId] == null) {
        continue;
      }

      const value = String(data[fieldId]);
      const label = resolveLocalizedText(field.label, form.locale) || fieldId;

      rows.push(`<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`);
    }
  }

  return `<table border="1" cellpadding="8" cellspacing="0">${rows.join('')}</table>`;
}

async function handleEmail(
  connection: IEmailConnection,
  submission: ISubmission,
  form: IDeclarativeForm,
): Promise<void> {
  if (submission.status !== 'completed') {
    return;
  }

  if (!connection.to) {
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const to = interpolateTemplate(connection.to, submission.data, { form });
  const localizedSubject = resolveLocalizedText(
    connection.subject,
    form.locale,
  );
  const subject = localizedSubject
    ? interpolateTemplate(localizedSubject, submission.data, { form })
    : '';

  if (!to || !subject) {
    return;
  }

  let html = '';

  if (connection.body) {
    html = interpolateTemplate(
      resolveLocalizedText(connection.body, form.locale),
      submission.data,
      { form },
    );
  }

  if (connection.include_responses) {
    html += generateResponsesHTML(form, submission.data);
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    to,
    subject,
    html: html || subject,
  });
}

async function handleWebhook(
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

async function handleAirtable(
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
