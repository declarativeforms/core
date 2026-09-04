import { isApiFailure } from '@/lib/api-client';

const BY_CODE: Record<string, string> = {
  ai_unconfigured:
    'Form generation is not switched on here. Ask your administrator to enable it.',
  branch_exists: 'A branch with that name already exists.',
  branch_protected: 'main is protected. Choose another name.',
  definition_too_large:
    'This form is too large to change automatically. Nothing was changed.',
  generation_already_failed:
    'That attempt already failed. Send the message again to start a new one.',
  generation_in_progress:
    'A change is already running on this branch. Wait for it to finish.',
  generation_invalid:
    'The new form did not pass validation, so nothing was changed. Try rewording the request.',
  generation_rate_limited:
    'Studio is busy right now. Wait a moment and try again.',
  generation_refused: 'That request was refused. Try rewording it.',
  generation_unavailable: 'Studio did not answer in time. Nothing was changed.',
  invalid_cursor: 'Could not load more of this conversation.',
  invalid_idempotency_key: 'Could not send that message. Try again.',
  invalid_prompt: 'Write a little more detail and try again.',
  network: 'You appear to be offline. Nothing was sent.',
  revision_conflict: 'Someone else changed this form first. Reloading.',
  timeout:
    'We lost the connection before the server answered. Check the conversation below before sending again.',
};

const BY_STATUS: Record<number, string> = {
  400: 'That request was not valid. Check the details and try again.',
  401: 'Your session expired. Sign in again.',
  403: 'You do not have permission for that. Ask an admin of this organization.',
  404: 'That form or branch is no longer available.',
  409: 'That change collided with another one. Reload and try again.',
  422: 'That change did not pass validation.',
  429: 'Too many requests. Wait a minute and try again.',
  500: 'Something went wrong on the server. Try again.',
  503: 'That service is unavailable right now. Try again shortly.',
};

export function describeError(error: unknown): string {
  if (!isApiFailure(error)) {
    return 'Something went wrong. Try again.';
  }

  if (error.errorCode && BY_CODE[error.errorCode]) {
    return BY_CODE[error.errorCode];
  }

  if (error.fieldErrors) {
    const keys = Object.keys(error.fieldErrors);
    const root = error.fieldErrors['/'];

    if (root) {
      return root;
    }

    if (keys.length > 0) {
      return error.fieldErrors[keys[0]];
    }
  }

  return BY_STATUS[error.status] ?? 'Something went wrong. Try again.';
}

export function describeFieldErrors(error: unknown): Array<string> {
  if (!isApiFailure(error) || !error.fieldErrors) {
    return [];
  }

  const result: Array<string> = [];

  for (const key of Object.keys(error.fieldErrors)) {
    result.push(error.fieldErrors[key]);
  }

  return result;
}

export function isUnknownOutcome(error: unknown): boolean {
  return isApiFailure(error) && error.status === 0;
}
