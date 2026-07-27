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

      rows.push(`<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`);
    }
  }

  return `<table border="1" cellpadding="8" cellspacing="0">${rows.join('')}</table>`;
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

    const resend = new Resend(process.env.RESEND_API_KEY);

    const to = interpolateTemplate(connection.to, submission.data, { form });

    const subject = interpolateTemplate(
      resolveLocalizedText(connection.subject, form.locale),
      submission.data,
      { form },
    );

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
}
