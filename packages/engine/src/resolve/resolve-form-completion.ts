import type {
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
  IResolvedFormCompletion,
  IResolvedFormCompletionRule,
} from '../types';
import { resolveFormButton } from './resolve-form-button';
import { resolveLocalizedText } from './localize';

function resolveCompletionFields(
  completion: IDeclarativeFormCompletion,
  locale: string,
): IResolvedFormCompletion {
  return {
    ...(completion.title !== undefined && {
      title: resolveLocalizedText(completion.title, locale),
    }),
    ...(completion.message !== undefined && {
      message: resolveLocalizedText(completion.message, locale),
    }),
    ...(completion.button !== undefined && {
      button: resolveFormButton(completion.button, locale),
    }),
  };
}

/**
 * Localize the completion screen(s). Rule selection (`when`) is data-dependent
 * and left to `compile`; here every rule is localized in place.
 */
export function resolveFormCompletion(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[],
  locale: string,
): IResolvedFormCompletion | IResolvedFormCompletionRule[] {
  if (Array.isArray(completion)) {
    return completion.map((rule) => ({
      ...resolveCompletionFields(rule, locale),
      ...(rule.when !== undefined && { when: rule.when }),
    }));
  }
  return resolveCompletionFields(completion, locale);
}
