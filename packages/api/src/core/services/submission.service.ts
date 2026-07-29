import {
  evaluateExpression,
  isDeclarativeConnectionType,
  validateFormData,
  type IDeclarativeForm,
  type ISubmission,
} from '@declarativeforms/core';
import { randomBytes } from 'node:crypto';
import type { SubmissionRepository } from '../repositories';
import type { IConnectionStrategy, IValidationStrategy } from '../strategies';
import type { FormService } from './form.service';

export class SubmissionValidationError extends Error {
  constructor(public readonly details: Record<string, string>) {
    super('The submission is invalid.');
    this.name = 'SubmissionValidationError';
  }
}

export class SubmissionService {
  constructor(
    private formService: FormService,
    private submissionRepository: SubmissionRepository,
    private validationStrategies: Array<IValidationStrategy>,
    private connectionStrategies: Array<IConnectionStrategy>,
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
  ): Promise<ISubmission | null> {
    const resolvedForm = await this.formService.resolveById(formId);

    if (!resolvedForm) {
      return null;
    }

    const form = resolvedForm.definition;
    const persistedFormId = form.id || '';
    const existingSubmission = submissionId
      ? await this.submissionRepository.find(persistedFormId, submissionId)
      : null;

    if (submissionId && !existingSubmission) {
      return null;
    }

    if (existingSubmission?.status === 'completed') {
      if (!isPartial && resolvedForm.trusted) {
        await this.processConnections(form, existingSubmission);
        await this.submissionRepository.update(
          persistedFormId,
          existingSubmission,
        );
      }
      return existingSubmission;
    }

    const candidateData = existingSubmission
      ? { ...existingSubmission.data, ...data }
      : data;
    const validation = validateFormData(
      form,
      form.locale || 'en',
      candidateData,
      {
        partial: isPartial,
      },
    );

    if (Object.keys(validation.errors).length > 0) {
      throw new SubmissionValidationError(validation.errors);
    }

    const uploadErrors = validateUploadReferences(
      form,
      validation.data,
      formId,
    );
    if (Object.keys(uploadErrors).length > 0) {
      throw new SubmissionValidationError(uploadErrors);
    }

    for (const strategy of this.validationStrategies) {
      const error = await strategy.validate(form, validation.data, {
        isPartial,
        ipAddress: metadata.ipAddress,
      });

      if (error) {
        throw new SubmissionValidationError({ _form: error });
      }
    }

    const now = new Date().toISOString();
    const status = isPartial ? 'partial' : 'completed';

    let submission: ISubmission;

    if (existingSubmission) {
      submission = {
        ...existingSubmission,
        data: validation.data,
        status,
        updated_at: now,
      };

      await this.submissionRepository.update(persistedFormId, submission);
    } else {
      submission = {
        created_at: now,
        data: validation.data,
        form_id: persistedFormId,
        id: randomBytes(6).toString('hex'),
        metadata: {
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
        },
        status,
        updated_at: now,
      };

      await this.submissionRepository.insert(submission);
    }

    if (!isPartial && resolvedForm.trusted) {
      await this.processConnections(form, submission);
      await this.submissionRepository.update(persistedFormId, submission);
    }

    return submission;
  }

  public async findById(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.submissionRepository.find(formId, submissionId);
  }

  public async list(formId: string): Promise<Array<ISubmission>> {
    return this.submissionRepository.findAll(formId);
  }

  private async processConnections(
    form: IDeclarativeForm,
    submission: ISubmission,
  ): Promise<void> {
    if (!form.connections || form.connections.length === 0) {
      return;
    }

    for (const [connectionIndex, connection] of form.connections.entries()) {
      if (!isDeclarativeConnectionType(connection.type)) {
        continue;
      }

      if (
        connection.when &&
        !evaluateExpression(connection.when, submission.data)
      ) {
        continue;
      }

      const strategy = this.connectionStrategies.find(
        (entry) => entry.type === connection.type,
      );

      if (!strategy) {
        continue;
      }

      const existingDelivery = submission.deliveries?.find(
        (delivery) => delivery.connection_index === connectionIndex,
      );

      if (
        existingDelivery?.status === 'delivered' ||
        (existingDelivery?.attempts ?? 0) >= 3
      ) {
        continue;
      }

      const updatedAt = new Date().toISOString();

      try {
        await strategy.handle(connection, submission, form);
        this.setDelivery(submission, {
          attempts: (existingDelivery?.attempts ?? 0) + 1,
          connection_index: connectionIndex,
          status: 'delivered',
          type: connection.type,
          updated_at: updatedAt,
        });
      } catch (error) {
        this.setDelivery(submission, {
          attempts: (existingDelivery?.attempts ?? 0) + 1,
          connection_index: connectionIndex,
          error:
            error instanceof Error
              ? error.message.slice(0, 500)
              : 'Connection delivery failed.',
          status: 'failed',
          type: connection.type,
          updated_at: updatedAt,
        });
      }
    }
  }

  private setDelivery(
    submission: ISubmission,
    delivery: NonNullable<ISubmission['deliveries']>[number],
  ): void {
    const deliveries = submission.deliveries ?? [];
    submission.deliveries = [
      ...deliveries.filter(
        (candidate) => candidate.connection_index !== delivery.connection_index,
      ),
      delivery,
    ];
  }
}

function validateUploadReferences(
  form: IDeclarativeForm,
  data: Record<string, unknown>,
  formId: string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const section of form.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (
        !field.id ||
        !['camera', 'file_upload', 'signature'].includes(field.type || '') ||
        data[field.id] === undefined
      ) {
        continue;
      }

      const submittedValue = data[field.id];
      const values: unknown[] = Array.isArray(submittedValue)
        ? submittedValue
        : [submittedValue];
      if (
        values.some(
          (value) =>
            typeof value !== 'string' || !isFormUploadUrl(value, formId),
        )
      ) {
        errors[field.id] = 'The file reference was not uploaded for this form.';
      }
    }
  }

  return errors;
}

function isFormUploadUrl(value: string, formId: string): boolean {
  try {
    const configuredBase = new URL(
      process.env.AWS_S3_BASE_URL || '/api/v1/files',
      'http://local.invalid',
    );
    const candidate = new URL(value, configuredBase);
    const configuredIsAbsolute = /^https?:\/\//i.test(
      process.env.AWS_S3_BASE_URL || '',
    );
    const pathPrefix = `${configuredBase.pathname.replace(/\/$/, '')}/uploads/${formId}/`;

    return (
      (!configuredIsAbsolute || candidate.origin === configuredBase.origin) &&
      candidate.pathname.startsWith(pathPrefix) &&
      !candidate.search &&
      !candidate.hash
    );
  } catch {
    return false;
  }
}
