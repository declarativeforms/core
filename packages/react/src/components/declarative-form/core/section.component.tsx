import { forwardRef } from 'react';
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from 'react-hook-form';

import { Button } from '../../ui';
import { useI18n } from '../../../i18n';
import {
  buildDefaultValues,
  resolveFieldVisibility,
  type FormAction,
  type FormView,
} from '@declarativeforms/core';
import { DeclarativeFormField } from './field.component';
import type { FieldComponentRegistry } from './field-registry';

export type FormViewRendererProps = {
  view: FormView;
  data: Record<string, unknown>;
  sectionHistory: string[];
  dispatch: (action: FormAction) => void;
  onSubmit: (sectionData: FieldValues) => void | Promise<void>;
  components: FieldComponentRegistry;
  disabled?: boolean;
  onFieldError?: (error: Error, fieldId?: string) => void;
};

export const FormViewRenderer = forwardRef<
  HTMLFormElement,
  FormViewRendererProps
>(function FormViewRenderer(props, ref) {
  const { t } = useI18n();
  const section = props.view.section;
  const form = useForm({
    defaultValues: buildDefaultValues(section, props.data),
  });

  const hasVisibleWhen = section.fields.some((f) => f.visible_when);
  const watchedValues = useWatch({ control: form.control });
  const currentData = watchedValues
    ? hasVisibleWhen
      ? { ...props.data, ...watchedValues }
      : props.data
    : props.data;

  const handleSubmit = form.handleSubmit(
    (data: FieldValues) => props.onSubmit(data),
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        form.setFocus(firstErrorField);
      }
    },
  );

  return (
    <FormProvider {...form}>
      <form
        ref={ref}
        tabIndex={-1}
        aria-label={section.title || undefined}
        aria-busy={props.disabled}
        onSubmit={handleSubmit}
        noValidate
        className="outline-none"
      >
        <fieldset
          disabled={props.disabled}
          className="border-0 p-0 m-0 min-w-0"
        >
          <div className="space-y-6">
            {section.fields.map((field) => (
              <DeclarativeFormField
                key={field.id}
                field={resolveFieldVisibility(field, currentData)}
                form={form}
                components={props.components}
                data={props.data}
                onFieldError={props.onFieldError}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            {props.sectionHistory.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={props.disabled || form.formState.isSubmitting}
                onClick={() => props.dispatch({ type: 'go_back' })}
              >
                {t('section.back')}
              </Button>
            ) : (
              <div />
            )}
            <Button
              type="submit"
              disabled={props.disabled || form.formState.isSubmitting}
            >
              {t('section.next')}
            </Button>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
});
