'use client';
import type { IRenderableCheckboxField } from '@declarativeforms/engine';
import { Checkbox, FieldLabel } from '@/components/ui';
import {
  bindElement,
  HtmlText,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function CheckboxField(
  props: FieldProps<IRenderableCheckboxField, boolean>,
): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        {...bindElement(props.control)}
        checked={props.control.value === true}
        onCheckedChange={(checked) => props.control.onChange(checked === true)}
        aria-required={props.field.required}
        aria-invalid={
          props.form.getFieldState(props.control.name, props.form.formState)
            .invalid
        }
      />
      <FieldLabel
        htmlFor={props.control.name}
        className="block cursor-pointer text-sm/5 font-normal"
      >
        <HtmlText html={props.field.label} />
        {props.field.required && (
          <span
            className="ml-1 font-medium text-destructive"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </FieldLabel>
    </div>
  );
}
