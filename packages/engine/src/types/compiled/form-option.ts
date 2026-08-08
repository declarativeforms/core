/**
 * A concrete option in a compiled field. The authored shorthand (bare string,
 * or `{ label?, value? }`) has been normalized so both `label` and `value` are
 * present and the label is a resolved string.
 */
export type ICompiledFormOption = {
  label: string;
  value: string;
};
