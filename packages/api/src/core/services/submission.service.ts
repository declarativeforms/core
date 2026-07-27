import {
  evaluateExpression,
  isDeclarativeConnectionType,
  type IDeclarativeForm,
  type ISubmission,
} from '@declarativeforms/core';
import { randomBytes } from 'node:crypto';
import type { SubmissionRepository } from '../repositories';
import type { IConnectionStrategy, IValidationStrategy } from '../strategies';
import type { FormService } from './form.service';

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
    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    for (const strategy of this.validationStrategies) {
      const error = await strategy.validate(form, data, {
        isPartial,
        ipAddress: metadata.ipAddress,
      });

      if (error) {
        return null;
      }
    }

    const now = new Date().toISOString();
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
        return existingSubmission;
      }

      submission = {
        ...existingSubmission,
        data: {
          ...existingSubmission.data,
          ...data,
        },
        status,
        updated_at: now,
      };

      await this.submissionRepository.update(persistedFormId, submission);
    } else {
      submission = {
        created_at: now,
        data,
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

    if (!isPartial) {
      await this.processConnections(form, submission);
    }

    return submission;
  }

  public async findById(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.submissionRepository.find(formId, submissionId);
  }

  public async list(formId: string): Promise<Array<ISubmission> | null> {
    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    return this.submissionRepository.findAll(formId);
  }

  private async processConnections(
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

      await strategy.handle(connection, submission, form);
    }
  }
}
