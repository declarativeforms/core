import type { ChangeEvent } from 'react';

import type { FieldControl } from './field.types';

/**
 * The parts of a control that attach to a native element no matter how the
 * displayed value is managed. Split out for fields whose visible input holds
 * something other than the answer, such as an address search query.
 *
 * Passing `ref` through is what lets the section focus the first invalid field
 * on submit, so every field that can hold focus should forward it.
 */
export function bindElement(
  control: Pick<FieldControl, 'name' | 'ref' | 'onBlur'>,
) {
  return {
    name: control.name,
    ref: control.ref,
    onBlur: control.onBlur,
  };
}

/**
 * Bind a `FieldControl` to a native `<input>` or `<textarea>`.
 *
 * The unwrapping of `event.target.value` is explicit here rather than relying
 * on react-hook-form doing it implicitly for a spread `onChange`, which is what
 * keeps the field layer free of the form library.
 *
 * `value ?? ''` matters: a field with no answer yet would otherwise start
 * uncontrolled and switch to controlled on first keystroke.
 */
export function bindTextInput(control: FieldControl<string>) {
  return {
    ...bindElement(control),
    value: control.value ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      control.onChange(event.target.value),
  };
}
