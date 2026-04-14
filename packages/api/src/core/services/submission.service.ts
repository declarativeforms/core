import { faker } from '@faker-js/faker';
import { evaluateExpression } from '@declarativeforms/common';
import { isDeclarativeConnectionType } from '@declarativeforms/types';
import type { IDeclarativeForm, ISubmission } from '@declarativeforms/types';
import type { GitHubFileRepository, SubmissionRepository } from '../repositories';
import type { GitHubGateway } from '../gateways';
import type { FormService } from './form.service';
import type { IConnectionStrategy, IValidationStrategy } from '../strategies';

const GITHUB_FORM_PREFIX = 'a';
const STUDIO_FORM_PREFIX = 'b';

export class SubmissionService {
  constructor(
    private formService: FormService,
    private gitHubFileRepository: GitHubFileRepository,
    private submissionRepository: SubmissionRepository,
    private gitHubGateway: GitHubGateway,
    private validationStrategies: IValidationStrategy[],
    private connectionStrategies: IConnectionStrategy[],
  ) {}

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

      if (connection.when && !evaluateExpression(connection.when, submission.data)) {
        continue;
      }

      const strategy = this.connectionStrategies.find(s => s.type === connection.type);

      if (strategy) {
        await strategy.handle(connection, submission, form);
      }
    }
  }

  async createOrUpdate(input: {
    formId: string;
    data: Record<string, unknown>;
    isPartial: boolean;
    metadata: {
      ipAddress: string;
      userAgent: string;
    };
    submissionId?: string;
  }): Promise<ISubmission | null> {
    const form = await this.formService.findById(input.formId);

    if (!form) {
      return null;
    }

    for (const strategy of this.validationStrategies) {
      const error = await strategy.validate(form, input.data, {
        ip: input.metadata.ipAddress,
        isPartial: input.isPartial,
      });

      if (error) {
        return null;
      }
    }

    const now = new Date().toISOString();
    const status = input.isPartial ? 'partial' : 'completed';
    const persistedFormId = form.id || '';

    let submission: ISubmission;

    if (input.submissionId) {
      const existingSubmission = await this.submissionRepository.find(
        persistedFormId,
        input.submissionId,
      );

      if (!existingSubmission) {
        return null;
      }

      if (existingSubmission.status === 'completed' && !input.isPartial) {
        return existingSubmission;
      }

      submission = {
        ...existingSubmission,
        data: {
          ...existingSubmission.data,
          ...input.data,
        },
        status,
        updated_at: now,
      };

      await this.submissionRepository.update(persistedFormId, submission);
    } else {
      submission = {
        created_at: now,
        data: input.data,
        form_id: persistedFormId,
        id: faker.string.alphanumeric({ casing: 'lower', length: 8 }),
        metadata: {
          ip_address: input.metadata.ipAddress,
          user_agent: input.metadata.userAgent,
        },
        status,
        updated_at: now,
      };

      await this.submissionRepository.insert(submission);
    }

    await this.processConnections(form, submission);

    return submission;
  }

  async findById(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.submissionRepository.find(formId, submissionId);
  }

  async listFormSubmissions(
    formId: string,
    token: string,
  ): Promise<Array<ISubmission> | null> {
    if (!formId.startsWith(GITHUB_FORM_PREFIX)) {
      return null;
    }

    const form = await this.gitHubFileRepository.find(formId);

    if (!form) {
      return null;
    }

    const canAccess = form.owner && form.repository
      ? await this.gitHubGateway.hasAdminOrPushPermissions(
          token,
          form.owner,
          form.repository,
        )
      : false;

    if (!canAccess) {
      return null;
    }

    return this.submissionRepository.findAll(formId);
  }

  async listStudioFormSubmissions(
    formId: string,
  ): Promise<Array<ISubmission> | null> {
    if (!formId.startsWith(STUDIO_FORM_PREFIX)) {
      return null;
    }

    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    return this.submissionRepository.findAll(formId);
  }
}
