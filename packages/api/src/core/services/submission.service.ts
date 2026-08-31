import {
  compile,
  evaluateExpression,
  isDeclarativeConnectionType,
  resolve,
  validateField,
} from '@declarativeforms/engine';
import type { IDeclarativeForm, ISubmission } from '@declarativeforms/engine';
import { randomBytes } from 'node:crypto';
import type { SubmissionRepository } from '../repositories';
import type { FormService } from './form.service';
import type { JobService } from './job.service';

export type SubmissionResult =
  | { type: 'created'; submission: ISubmission }
  | { type: 'invalid'; errors: Record<string, string> };

export class SubmissionService {
  constructor(
    private formService: FormService,
    private submissionRepository: SubmissionRepository,
    private jobService: JobService,
  ) {}

  public async createOrUpdate(
    formId: string,
    data: Record<string, unknown>,
    isPartial: boolean,
    metadata: {
      ipAddress: string;
      userAgent: string;
    },
    submissionId?: string,
  ): Promise<SubmissionResult | null> {
    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    if (!isPartial) {
      const errors = this.validate(form, data);

      if (Object.keys(errors).length > 0) {
        return { type: 'invalid', errors };
      }
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const status = isPartial ? 'partial' : 'completed';
    const persistedFormId = form.id || '';

    let submission: ISubmission;

    if (submissionId) {
      const existingSubmission = await this.submissionRepository.find(
        persistedFormId,
        submissionId,
      );

      if (!existingSubmission) {
        return null;
      }

      if (existingSubmission.status === 'completed' && !isPartial) {
        return { type: 'created', submission: existingSubmission };
      }

      submission = {
        ...existingSubmission,
        data: {
          ...existingSubmission.data,
          ...data,
        },
        status,
        updated_at: timestamp,
      };

      await this.submissionRepository.update(persistedFormId, submission);
    } else {
      submission = {
        created_at: timestamp,
        data,
        form_id: persistedFormId,
        id: randomBytes(4).toString('hex'),
        metadata: {
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
        },
        status,
        updated_at: timestamp,
      };

      await this.submissionRepository.insert(submission);
    }

    await this.scheduleConnections(form, submission, now);

    return { type: 'created', submission };
  }

  public async findById(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.submissionRepository.find(formId, submissionId);
  }

  private validate(
    form: IDeclarativeForm,
    data: Record<string, unknown>,
  ): Record<string, string> {
    const compiled = compile(resolve(form, form.locale ?? 'en'), data);

    const sectionsById = new Map(
      compiled.sections.map((section) => [section.id, section]),
    );

    const errors: Record<string, string> = {};

    const visited = new Set<string>();

    let currentId: string | undefined = compiled.sections[0]?.id;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);

      const section = sectionsById.get(currentId);

      if (!section) {
        break;
      }

      for (const field of section.fields) {
        if (!field.visible) {
          continue;
        }

        const message = validateField(field, data[field.id], data);

        if (message) {
          errors[field.id] = message;
        }
      }

      currentId =
        !section.next ||
        section.next === 'done' ||
        section.next.startsWith('https://')
          ? undefined
          : section.next;
    }

    return errors;
  }

  private async scheduleConnections(
    form: IDeclarativeForm,
    submission: ISubmission,
    now: Date,
  ): Promise<void> {
    for (const connection of form.connections ?? []) {
      if (!isDeclarativeConnectionType(connection.type)) {
        continue;
      }

      const trigger = connection.trigger_on ?? 'completed';

      if (trigger !== 'any' && trigger !== submission.status) {
        continue;
      }

      if (
        connection.when &&
        !evaluateExpression(connection.when, submission.data)
      ) {
        continue;
      }

      const delayMinutes = connection.delay_minutes ?? 0;

      if (!Number.isInteger(delayMinutes) || delayMinutes < 0) {
        throw new Error(
          'Connection delay_minutes must be a non-negative integer',
        );
      }

      await this.jobService.schedule(
        'submission',
        { connection, form, submission },
        new Date(now.getTime() + delayMinutes * 60_000),
      );
    }
  }
}
