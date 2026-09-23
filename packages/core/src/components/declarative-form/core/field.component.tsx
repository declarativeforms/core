'use client';
import { useEffect, useId } from 'react';
import {
  Controller,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
} from 'react-hook-form';
import { Field, FieldDescription, FieldError } from '@/components/ui';
import { validateField, type IRenderableField } from '@declarativeforms/engine';
import { HtmlText } from '@/components/declarative-form/supporting';
import { FieldLabel } from './field-label.component';
import { fieldRegistry } from './field-registry';

export function DeclarativeFormField(props: {
  field: IRenderableField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
  formId: string;
}): React.JSX.Element | null {
  const helperTextId = useId();

  useEffect(() => {
    if (!props.field.visible) {
      props.form.unregister(props.field.id);
    }
  }, [props.field.visible, props.field.id, props.form]);

  if (!props.field.visible) {
    return null;
  }

  const Renderer = fieldRegistry[props.field.type];
  if (!Renderer) {
    return null;
  }

  const rules = {
    validate: {
      rules: (value: unknown, values: Record<string, unknown>) =>
        validateField(props.field, value, values) ?? true,
    },
  } as RegisterOptions;

  return (
    <Controller
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={(renderProps) =>
        props.field.type === 'hidden' ? (
          <Renderer
            control={renderProps.field}
            field={props.field}
            form={props.form}
            formId={props.formId}
          />
        ) : (
          <Field
            aria-describedby={
              props.field.type !== 'text_block' && props.field.helperText
                ? helperTextId
                : undefined
            }
          >
            <FieldLabel field={props.field} />
            <Renderer
              control={renderProps.field}
              field={props.field}
              form={props.form}
              formId={props.formId}
            />
            {props.field.type !== 'text_block' && props.field.helperText ? (
              <FieldDescription id={helperTextId}>
                <HtmlText html={props.field.helperText} />
              </FieldDescription>
            ) : null}
            <FieldError errors={[renderProps.fieldState.error]} />
          </Field>
        )
      }
    />
  );
}
