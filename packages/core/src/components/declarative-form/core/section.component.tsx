import { forwardRef } from 'react';
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from 'react-hook-form';

import { evaluateExpression, type IRenderableSection } from '@declarativeforms/engine';
import { Button } from '../../ui';
import { useI18n } from '@/i18n';
import { DeclarativeFormField } from './field.component';

// TODO: rather inline these types for props
type DeclarativeFormSectionProps = {
  section: IRenderableSection;
  data: Record<string, unknown>;
  onBack: () => void;
  onSubmit: (sectionData: FieldValues) => void | Promise<void>;
};

export const DeclarativeFormSection = forwardRef<
  HTMLFormElement,
  DeclarativeFormSectionProps
>(function DeclarativeFormSection(props, ref) {
  const { t } = useI18n();
  const form = useForm({ defaultValues: props.section.defaultValues });

  // TODO: instead of liveValues, name them a bit closer to what they really are such as values
  const liveValues = useWatch({ control: form.control });
  // TODO: this variable is a bit confusing and misleading, change it or simplifying it
  const answers = { ...props.data, ...(liveValues ?? {}) };
  const fields = props.section.fields.map((field) =>
    field.visibleWhen
      ? { ...field, visible: evaluateExpression(field.visibleWhen, answers) }
      : field,
  );

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
        aria-label={props.section.title || undefined}
        onSubmit={handleSubmit}
        noValidate
        className="outline-none"
      >
        <div className="space-y-6">
          {fields.map((field) => (
            <DeclarativeFormField key={field.id} field={field} form={form} />
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          {props.section.canGoBack ? (
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={props.onBack}
            >
              {t('section.back')}
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t('section.next')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
});
