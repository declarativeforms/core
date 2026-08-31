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

export function resolveFormCompletion(
  completion:
    IDeclarativeFormCompletion | Array<IDeclarativeFormCompletionRule>,
  locale: string,
): IResolvedFormCompletion | Array<IResolvedFormCompletionRule> {
  if (Array.isArray(completion)) {
    return completion.map((rule) => ({
      ...resolveCompletionFields(rule, locale),
      ...(rule.when !== undefined && { when: rule.when }),
    }));
  }

  return resolveCompletionFields(completion, locale);
}
