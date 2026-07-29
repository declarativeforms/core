import {
  interpolateTemplate,
  isDeclarativeFieldType,
  resolveLocalizedText,
  type IDeclarativeForm,
  type IEmailConnection,
  type ISubmission,
} from '@declarativeforms/core';
import { Resend } from 'resend';

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

      rows.push(
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
      );
    }
  }

  return `<table border="1" cellpadding="8" cellspacing="0">${rows.join('')}</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export class EmailConnectionStrategy {
  readonly type = 'email';

  public async handle(
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

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      throw new Error('Email delivery is not configured.');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const to = interpolateTemplate(connection.to, submission.data, { form });

    const subject = interpolateTemplate(
      resolveLocalizedText(connection.subject, form.locale) ||
        'Form submission',
      submission.data,
      { form },
    );

    if (!to) {
      return;
    }

    let html = '';

    if (connection.body) {
      html = interpolateTemplate(
        resolveLocalizedText(connection.body, form.locale),
        escapeEmailTemplateData(submission.data) as Record<string, unknown>,
        { form },
      );
    }

    if (connection.include_responses) {
      html += generateResponsesHTML(form, submission.data);
    }

    const delivery = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html: html || subject,
    });

    if (delivery.error) {
      throw new Error(`Email delivery failed: ${delivery.error.message}`);
    }
  }
}

function escapeEmailTemplateData(value: unknown): unknown {
  if (typeof value === 'string') {
    return escapeHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map(escapeEmailTemplateData);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        escapeEmailTemplateData(entry),
      ]),
    );
  }

  return value;
}
