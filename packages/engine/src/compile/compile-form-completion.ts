import type {
  ICompiledFormCompletion,
  IResolvedFormCompletion,
  IResolvedFormCompletionRule,
} from '../types';
import { compileFormButton } from './compile-form-button';
import { evaluateExpression } from './expression';
import { interpolateTemplate } from './template';

function selectCompletion(
  completion:
    | IResolvedFormCompletion
    | IResolvedFormCompletionRule[]
    | undefined,
  data: Record<string, unknown>,
): IResolvedFormCompletion | undefined {
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

/**
 * Select the completion screen matching the answers (first rule without a
 * `when`, or the first whose `when` is truthy) and interpolate its text.
 */
export function compileFormCompletion(
  completion:
    | IResolvedFormCompletion
    | IResolvedFormCompletionRule[]
    | undefined,
  data: Record<string, unknown>,
): ICompiledFormCompletion | undefined {
  const matching = selectCompletion(completion, data);
  if (!matching) {
    return undefined;
  }
  return {
    ...(matching.title !== undefined && {
      title: interpolateTemplate(matching.title, data),
    }),
    ...(matching.message !== undefined && {
      message: interpolateTemplate(matching.message, data),
    }),
    ...(matching.button !== undefined && {
      button: compileFormButton(matching.button, data),
    }),
  };
}
