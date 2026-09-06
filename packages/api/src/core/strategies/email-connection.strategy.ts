import {
  interpolateTemplate,
  isDeclarativeFieldType,
  resolveLocalizedText,
} from '@declarativeforms/engine';
import type {
  IDeclarativeForm,
  IEmailConnection,
  ISubmission,
  IUploadedFile,
} from '@declarativeforms/engine';
import { Resend } from 'resend';

export class EmailConnectionStrategy {
  readonly type = 'email';

  public async handle(
    connection: IEmailConnection,
    submission: ISubmission,
    form: IDeclarativeForm,
  ): Promise<void> {
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
      html += this.generateResponsesHtml(form, submission.data);
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to,
      subject,
      html: html || subject,
    });
  }

  private generateResponsesHtml(
    form: IDeclarativeForm,
    data: Record<string, unknown>,
  ): string {
    const rows: Array<string> = [];

    for (const section of form.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (isDeclarativeFieldType(field.type) && field.type === 'hidden') {
          continue;
        }

        const fieldId = field.id;

        if (!fieldId || data[fieldId] == null) {
          continue;
        }

        const isMediaField =
          isDeclarativeFieldType(field.type) &&
          (field.type === 'file_upload' ||
            field.type === 'camera' ||
            field.type === 'signature');
        const value = isMediaField
          ? this.generateUploadedFilesHtml(data[fieldId])
          : String(data[fieldId]);
        const label = resolveLocalizedText(field.label, form.locale) || fieldId;

        rows.push(
          `<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`,
        );
      }
    }

    return `<table border="1" cellpadding="8" cellspacing="0">${rows.join('')}</table>`;
  }

  private generateUploadedFilesHtml(value: unknown): string {
    const values = Array.isArray(value) ? value : [value];

    return values
      .filter((entry): entry is IUploadedFile => this.isUploadedFile(entry))
      .map(
        (file) =>
          `<a href="${file.url}">${file.name}</a> (${file.type}, ${this.formatFileSize(file.size)})`,
      )
      .join('<br>');
  }

  private isUploadedFile(value: unknown): value is IUploadedFile {
    return (
      typeof value === 'object' &&
      value !== null &&
      'url' in value &&
      typeof value.url === 'string' &&
      'name' in value &&
      typeof value.name === 'string' &&
      'size' in value &&
      typeof value.size === 'number' &&
      'type' in value &&
      typeof value.type === 'string'
    );
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const size = Math.round((bytes / Math.pow(1024, index)) * 100) / 100;

    return `${size} ${units[index]}`;
  }
}
