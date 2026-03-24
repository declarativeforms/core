import { evaluateExpression, interpolateTemplate, resolveLocalizedText } from "@declarativeforms/common";
import type { IDeclarativeFormCompletion, IDeclarativeFormCompletionRule } from "@declarativeforms/types";
import type { CompiledCompletion } from "../types";

type CompletionLike = {
  title?: unknown;
  message?: unknown;
  button?: unknown;
};

type CompletionRuleLike<T extends CompletionLike> = T & { when?: string };

/**
 * Resolves the matching completion from a single or conditional completion config.
 * Rules are evaluated top-to-bottom; the first matching `when` wins.
 * An entry without `when` acts as the default and should be placed last.
 */
function resolveCompletion<T extends CompletionLike>(
  completion: T | CompletionRuleLike<T>[] | undefined,
  data: Record<string, unknown>
): T | undefined {
  if (!completion) {
    return undefined;
  }

  if (!Array.isArray(completion)) {
    return completion;
  }

  for (const rule of completion) {
    if (rule.when) {
      if (evaluateExpression(rule.when, data)) {
        return rule;
      }
    } else {
      return rule;
    }
  }

  return undefined;
}

export function compileCompletion(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[] | undefined,
  locale: string,
  data: Record<string, unknown>,
): CompiledCompletion | undefined {
  const resolved = resolveCompletion(completion, data);

  if (!resolved) {
    return undefined;
  }

  return {
    title: resolved.title
      ? interpolateTemplate(resolveLocalizedText(resolved.title, locale), data)
      : undefined,
    message: resolved.message
      ? interpolateTemplate(resolveLocalizedText(resolved.message, locale), data)
      : undefined,
    button: resolved.button
      ? {
          label: interpolateTemplate(resolveLocalizedText(resolved.button.label, locale), data),
          url: interpolateTemplate(resolveLocalizedText(resolved.button.url, locale), data),
        }
      : undefined,
  };
}
