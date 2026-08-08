import type { ICompiledValidationRule } from './validation-rule';

/**
 * Properties shared by every field in a compiled form.
 *
 * This is a render-ready projection: `id`/`label` are guaranteed present and
 * their text is resolved+interpolated; `visible_when` has been assessed against
 * the data into a `visible` boolean (and kept as source so the app can
 * re-evaluate it live against in-progress answers); `required` is derived from
 * the validators; and the authored validator DSL is flattened into `validation`.
 */
export type ICompiledFormFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  visible_when?: string;
  validation: ICompiledValidationRule[];
};
