import { faker } from '@faker-js/faker';
import {
  findForm,
  findSubmission,
  findSubmissions,
  findStudioForm,
  insertSubmission,
  replaceSubmission,
} from '../repositories';
import { isDeclarativeFieldType } from '@declarativeforms/types';
import type { IDeclarativeForm, ISubmission } from '@declarativeforms/types';
import { processConnections } from './connections';
import { findFormById } from './forms';
import { hasRequiredGitHubPermissions } from '../gateways';
import { verifyOneTimePinVerificationToken } from './one-time-pin';
import { verifyTurnstileToken } from './turnstile';

function validateOneTimePinRequirements(
  form: IDeclarativeForm,
  data: Record<string, unknown>,
): string | null {
  for (const section of form.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (!isDeclarativeFieldType(field.type)) {
        continue;
      }

      if (field.type !== 'email' || field.otp !== true) {
        continue;
      }

      const fieldId = field.id;
      if (!fieldId) {
        continue;
      }

      const submittedEmail = data[fieldId];

      if (!submittedEmail) {
        continue;
      }

      const token = data[`${fieldId}__one_time_pin_token`];

      if (!token) {
        return `Email field '${fieldId}' requires OneTimePin verification.`;
      }

      const payload = verifyOneTimePinVerificationToken(String(token));

      if (
        !payload ||
        payload.field_id !== fieldId ||
        payload.email !== String(submittedEmail).trim().toLowerCase()
      ) {
        return `Invalid or expired OneTimePin verification for field '${fieldId}'.`;
      }
    }
  }

  return null;
}

async function validateTurnstileRequirements(
  form: IDeclarativeForm,
  data: Record<string, unknown>,
  ip?: string,
): Promise<string | null> {
  for (const section of form.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (!isDeclarativeFieldType(field.type)) {
        continue;
      }

      if (field.type !== 'turnstile') {
        continue;
      }

      const fieldId = field.id;
      if (!fieldId) {
        continue;
      }

      const token = data[fieldId];

      if (!token) {
        return `Turnstile field '${fieldId}' requires verification.`;
      }

      const isValid = await verifyTurnstileToken(String(token), ip);

      if (!isValid) {
        return `Turnstile verification failed for field '${fieldId}'.`;
      }
    }
  }

  return null;
}

export async function createOrUpdateSubmission(input: {
  formId: string;
  data: Record<string, unknown>;
  isPartial: boolean;
  metadata: {
    ipAddress: string;
    userAgent: string;
  };
  submissionId?: string;
}): Promise<ISubmission | null> {
  const form = await findFormById(input.formId);

  if (!form) {
    return null;
  }

  const oneTimePinError = validateOneTimePinRequirements(form, input.data);

  if (oneTimePinError) {
    return null;
  }

  if (!input.isPartial) {
    const turnstileError = await validateTurnstileRequirements(
      form,
      input.data,
      input.metadata.ipAddress,
    );

    if (turnstileError) {
      return null;
    }
  }

  const now = new Date().toISOString();
  const status = input.isPartial ? 'partial' : 'completed';
  const persistedFormId = form.id || '';

  let submission: ISubmission;

  if (input.submissionId) {
    const existingSubmission = await findSubmission(
      persistedFormId,
      input.submissionId,
    );

    if (!existingSubmission) {
      return null;
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

    await replaceSubmission(persistedFormId, input.submissionId, submission);
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

    await insertSubmission(submission);
  }

  await processConnections(form, submission);

  return submission;
}

export async function findSubmissionById(
  formId: string,
  submissionId: string,
): Promise<ISubmission | null> {
  return findSubmission(formId, submissionId);
}

export async function listFormSubmissions(
  formId: string,
  token: string,
): Promise<Array<ISubmission> | null> {
  const form = await findForm(formId);

  if (!form) {
    return null;
  }

  const canAccess = form.owner && form.repository
    ? await hasRequiredGitHubPermissions(
        token,
        form.owner,
        form.repository,
      )
    : false;

  if (!canAccess) {
    return null;
  }

  return findSubmissions(formId);
}

export async function listStudioFormSubmissions(
  formId: string,
): Promise<Array<ISubmission> | null> {
  const form = await findStudioForm(formId);

  if (!form) {
    return null;
  }

  return findSubmissions(formId);
}
