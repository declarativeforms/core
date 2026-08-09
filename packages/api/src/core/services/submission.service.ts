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
import type { IConnectionStrategy } from '../strategies';
import type { FormService } from './form.service';

/**
 * The outcome of a submission attempt. `null` (returned separately) means the
 * form or the referenced submission was not found.
 */
export type SubmissionResult =
  | { type: 'created'; submission: ISubmission }
  | { type: 'invalid'; errors: Record<string, string> };

export class SubmissionService {
  constructor(
    private formService: FormService,
    private submissionRepository: SubmissionRepository,
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
  ): Promise<SubmissionResult | null> {
    const form = await this.formService.findById(formId);

    if (!form) {
      return null;
    }

    // The server is the authority. A final submission is re-validated against
    // the same engine rules the client used; partial (draft) saves are not.
    if (!isPartial) {
      const errors = this.validate(form, data);

      if (Object.keys(errors).length > 0) {
        return { type: 'invalid', errors };
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
        return { type: 'created', submission: existingSubmission };
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
        id: randomBytes(4).toString('hex'),
        metadata: {
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
        },
        status,
        updated_at: now,
      };

      await this.submissionRepository.insert(submission);
    }

    await this.processConnections(form, submission);

    return { type: 'created', submission };
  }

  public async findById(
    formId: string,
    submissionId: string,
  ): Promise<ISubmission | null> {
    return this.submissionRepository.find(formId, submissionId);
  }

  /**
   * Validate a final submission. Compiles the form against the answers, then
   * walks the navigation path those answers produce (following each section's
   * resolved `next`), so sections skipped by conditional routing are never
   * required. Each visible field is checked with the engine's `validateField`,
   * the same code the browser runs. Returns `fieldId -> message` per failure.
   */
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

      const next = section.next;
      currentId =
        !next || next === 'done' || next.startsWith('https://')
          ? undefined
          : next;
    }

    return errors;
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
