import type {
  ICompiledFormCompletion,
  IResolvedFormCompletion,
  IResolvedFormCompletionRule,
} from '../types';
import { compileFormButton } from './compile-form-button';
import { evaluateExpression } from './expression';
import { interpolateTemplate } from './template';

function findMatchingCompletion(
  completion:
    IResolvedFormCompletion | Array<IResolvedFormCompletionRule> | undefined,
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

export function compileFormCompletion(
  completion:
    IResolvedFormCompletion | Array<IResolvedFormCompletionRule> | undefined,
  data: Record<string, unknown>,
): ICompiledFormCompletion | undefined {
  const matchingCompletion = findMatchingCompletion(completion, data);

  if (!matchingCompletion) {
    return undefined;
  }

  return {
    ...(matchingCompletion.title !== undefined && {
      title: interpolateTemplate(matchingCompletion.title, data),
    }),
    ...(matchingCompletion.message !== undefined && {
      message: interpolateTemplate(matchingCompletion.message, data),
    }),
    ...(matchingCompletion.button !== undefined && {
      button: compileFormButton(matchingCompletion.button, data),
    }),
  };
}
