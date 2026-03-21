import type { ICompletion, ICompletionRule } from "../../types";
import { evaluateExpression } from "./expression";

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
