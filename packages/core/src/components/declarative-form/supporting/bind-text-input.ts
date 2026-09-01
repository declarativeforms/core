import type { ChangeEvent } from 'react';
import type { FieldControl } from './field.types';

export type ElementBinding = Pick<FieldControl, 'name' | 'ref' | 'onBlur'>;

export type TextInputBinding = ElementBinding & {
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

export function bindElement(
  control: Pick<FieldControl, 'name' | 'ref' | 'onBlur'>,
): ElementBinding {
  return {
    name: control.name,
    ref: control.ref,
    onBlur: control.onBlur,
  };
}

export function bindTextInput(control: FieldControl<string>): TextInputBinding {
  return {
    ...bindElement(control),
    value: control.value ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      control.onChange(event.target.value),
  };
}
