import type { ICompiledFormField } from './form-field';

/**
 * A section in a compiled form. `title` is resolved+interpolated, and the
 * authored `next` routing has been assessed against the data into a single
 * concrete target (`next`): a section id, `'done'`, or an external URL.
 */
export type ICompiledFormSection = {
  id: string;
  title: string;
  fields: ICompiledFormField[];
  next?: string;
};
