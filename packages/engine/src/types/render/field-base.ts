import type { ICompiledValidationRule } from '../compiled';

/**
 * Properties every renderable field carries.
 *
 * Text is resolved+interpolated; `visible` is the assessed visibility for the
 * data the form was rendered with, and `visibleWhen` is the source expression
 * so the app can re-evaluate visibility live against in-progress answers.
 * `validation` is the normalized rule set the app turns into framework (e.g.
 * react-hook-form) rules. Per-type members add the display metadata each
 * renderer needs.
 */
export type IRenderableFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  visibleWhen?: string;
  validation: ICompiledValidationRule[];
};
