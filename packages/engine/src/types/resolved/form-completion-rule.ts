import type { IResolvedFormCompletion } from './form-completion';

/**
 * A completion screen guarded by an expression. When a form declares an array
 * of rules, the first whose `when` is truthy (or the first without a `when`)
 * is shown.
 */
export type IResolvedFormCompletionRule = IResolvedFormCompletion & {
  when?: string;
};
