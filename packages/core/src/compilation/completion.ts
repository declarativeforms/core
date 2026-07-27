import { evaluateExpression } from '../expression';
import { interpolateTemplate } from '../template';
import { resolveLocalizedText } from '../localization';
import type {
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
} from '../definition';
import type { CompiledCompletion } from '../types';

type CompletionLike = {
  title?: unknown;
  message?: unknown;
  button?: unknown;
};

type CompletionRuleLike<T extends CompletionLike> = T & { when?: string };

function resolveCompletion<T extends CompletionLike>(
  completion: T | CompletionRuleLike<T>[] | undefined,
  data: Record<string, unknown>,
): T | undefined {
  if (!completion) {
    return undefined;
  }

  if (!Array.isArray(completion)) {
    return completion;
  }

  for (const rule of completion) {
    if (!rule.when) {
      return rule;
    }

    if (evaluateExpression(rule.when, data)) {
      return rule;
    }
  }

  return undefined;
}

export function compileCompletion(
  completion:
    | IDeclarativeFormCompletion
    | IDeclarativeFormCompletionRule[]
    | undefined,
  locale: string,
  data: Record<string, unknown>,
): CompiledCompletion | undefined {
  const matchingCompletion = resolveCompletion(completion, data);

  if (!matchingCompletion) {
    return undefined;
  }

  return {
    title: matchingCompletion.title
      ? interpolateTemplate(
          resolveLocalizedText(matchingCompletion.title, locale),
          data,
        )
      : undefined,
    message: matchingCompletion.message
      ? interpolateTemplate(
          resolveLocalizedText(matchingCompletion.message, locale),
          data,
        )
      : undefined,
    button: matchingCompletion.button
      ? {
          label: interpolateTemplate(
            resolveLocalizedText(matchingCompletion.button.label, locale),
            data,
          ),
          url: interpolateTemplate(
            resolveLocalizedText(matchingCompletion.button.url, locale),
            data,
          ),
        }
      : undefined,
  };
}
