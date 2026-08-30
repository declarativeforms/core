'use client';

import { useEffect } from 'react';
import {
  Controller,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
} from 'react-hook-form';

import { Field, FieldError } from '../../ui';
import { validateField, type IRenderableField } from '@declarativeforms/engine';
import { FieldLabel } from './field-label.component';
import { fieldRegistry } from './field-registry';

export function DeclarativeFormField(props: {
  field: IRenderableField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
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
      render={({ field, fieldState }) =>
        props.field.type === 'hidden' ? (
          <Renderer
            controllerField={field}
            field={props.field}
            form={props.form}
          />
        ) : (
          <Field>
            <FieldLabel field={props.field} />
            <Renderer
              controllerField={field}
              field={props.field}
              form={props.form}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }
    />
  );
}
