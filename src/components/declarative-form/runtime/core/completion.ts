import type { ICompletion, ICompletionRule } from "../../types";
import { evaluateExpression } from "./expression";

/**
 * Resolves the matching completion from a single or conditional completion config.
 * Rules are evaluated top-to-bottom; the first matching `when` wins.
 * An entry without `when` acts as the default and should be placed last.
 */
export function resolveCompletion(
  completion: ICompletion | ICompletionRule[] | undefined,
  data: Record<string, unknown>
): ICompletion | undefined {
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
