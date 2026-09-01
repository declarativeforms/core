import type { IRenderableField } from '@declarativeforms/engine';

export type FieldControl<TValue = unknown> = {
  name: string;
  value: TValue;
  onChange: (next: TValue) => void;
  onBlur: () => void;
  ref: (instance: unknown) => void;
};

export type FieldProps<
  TField extends IRenderableField = IRenderableField,
  TValue = unknown,
> = {
  field: TField;
  control: FieldControl<TValue>;
};
