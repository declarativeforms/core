/**
 * A validation rule attached to a field, with its `message` already resolved to
 * a plain string. Structurally identical to `IDeclarativeFormValidator`.
 */
export type IResolvedFormValidator =
  | 'required'
  | { type: 'required'; message?: string }
  | { type: 'pattern'; regex: string; message?: string }
  | { type: 'min'; value: number | string; message?: string }
  | { type: 'max'; value: number | string; message?: string }
  | { type: 'min_length'; value: number; message?: string }
  | { type: 'max_length'; value: number; message?: string }
  | { type: 'expression'; expression: string; message?: string };
