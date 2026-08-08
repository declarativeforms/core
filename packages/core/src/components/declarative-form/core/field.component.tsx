import { useEffect } from 'react';
import {
  Controller,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

import { Field, FieldLabel as BaseFieldLabel, FieldError } from '../../ui';
import { useI18n } from '@/i18n';
import type { IRenderableField } from '@declarativeforms/engine';
import { buildFieldValidation } from '../supporting/validation';
import { HtmlText } from '../supporting/html-text';
import { FieldErrorBoundary } from '../supporting/field-error-boundary.component';
import { fieldRegistry } from './field-registry';


// TODO: Move this to it's own file. All react components should be in their own file
function FieldLabel({ field }: { field: IRenderableField }) {
  return (
    <BaseFieldLabel className="text-sm/4.5">
      <HtmlText html={field.label} />
      {field.required ? (
        <span className="font-medium text-red-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </BaseFieldLabel>
  );
}

export function DeclarativeFormField(props: {
  field: IRenderableField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const { t } = useI18n();
  // TODO: Don't deconstruct variables, just use them where needed.
  const { visible, id } = props.field;

  useEffect(() => {
    if (!visible) {
      props.form.unregister(id);
    }
  }, [visible, id, props.form]);

  if (!visible) {
    return null;
  }

  // TODO: don't create variables where not needed, just use them directly such as props.field.type.
  const renderableField = props.field;
  const rules = buildFieldValidation(renderableField, {
    emailFreeEmailBlocked: t('validation.email_free_blocked'),
    emailOtpRequired: t('validation.email_otp_required'),
  });
  const Renderer = fieldRegistry[renderableField.type];
  if (!Renderer) {
    return null;
  }

  // TODO: inline this condition where needed instead of creating it's own variable.
  const isHiddenField = renderableField.type === 'hidden';

  return (
    <Controller
      control={props.form.control}
      name={renderableField.id}
      rules={rules}
      render={({ field, fieldState }) =>
        isHiddenField ? (
          <FieldErrorBoundary fieldId={renderableField.id}>
            <Renderer
              controllerField={field}
              field={renderableField}
              form={props.form}
            />
          </FieldErrorBoundary>
        ) : (
          <Field>
            <FieldLabel field={renderableField} />
            <FieldErrorBoundary fieldId={renderableField.id}>
              <Renderer
                controllerField={field}
                field={renderableField}
                form={props.form}
              />
            </FieldErrorBoundary>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }
    />
  );
}
