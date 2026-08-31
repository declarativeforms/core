import type { IRenderableField } from '@declarativeforms/engine';

/**
 * A single field's binding to whatever form library the app happens to use.
 *
 * Deliberately framework-neutral: react-hook-form's `ControllerRenderProps`
 * satisfies this structurally, so `DeclarativeFormField` hands its controller
 * straight through with no adapter, and no field component imports
 * react-hook-form.
 *
 * `ref` is typed loosely on purpose. It is attached to whichever element the
 * field wants focused, and the form library only ever calls it.
 */
export type FieldControl<TValue = unknown> = {
  name: string;
  value: TValue;
  onChange: (next: TValue) => void;
  onBlur: () => void;
  ref: (instance: unknown) => void;
};

/**
 * What every field component receives. `field` is the engine's renderable
 * description, narrowed to the one type this component handles; `control` is
 * the value binding.
 *
 * `TValue` is a claim about the answer's shape, not a guarantee: answers come
 * back from restored submissions and URL prefill as arbitrary JSON, so a field
 * that depends on the shape still needs a runtime guard.
 */
export type FieldProps<
  TField extends IRenderableField = IRenderableField,
  TValue = unknown,
> = {
  field: TField;
  control: FieldControl<TValue>;
};
