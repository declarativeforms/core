/**
 * A normalized validation rule in a compiled form.
 *
 * The authored `IDeclarativeFormValidator` DSL (bare `'required'` shorthand,
 * optional messages) has been flattened: every rule carries a required `type`
 * and a fully-resolved, interpolated `message` string.
 */
export type ICompiledValidationRule =
  | { type: 'required'; message: string }
  | { type: 'pattern'; regex: string; message: string }
  | { type: 'min_length'; value: number; message: string }
  | { type: 'max_length'; value: number; message: string }
  | { type: 'min'; value: number | string; message: string }
  | { type: 'max'; value: number | string; message: string }
  | { type: 'expression'; expression: string; message: string };
