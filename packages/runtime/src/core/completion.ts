import { evaluateExpression } from "@declarativeforms/common";

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
export function resolveCompletion<T extends CompletionLike>(
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
