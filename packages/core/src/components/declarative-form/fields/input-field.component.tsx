import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';

export function InputField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useI18n();
  const placeholder = field.placeholder || t('input.placeholder');

  if (field.type === 'number') {
    return (
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={placeholder}
        type="text"
        inputMode="numeric"
        pattern={field.integer ? '^[0-9]+$' : undefined}
        required={field.required}
        aria-required={field.required}
      />
    );
  }

  if (
    field.type === 'date' ||
    field.type === 'date_month' ||
    field.type === 'time'
  ) {
    return (
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={placeholder}
        type={field.inputType}
        required={field.required}
        aria-required={field.required}
        min={field.min}
        max={field.max}
      />
    );
  }

  if (
    field.type === 'short_text' ||
    field.type === 'url' ||
    field.type === 'mobile_number'
  ) {
    return (
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={placeholder}
        type={field.inputType}
        required={field.required}
        aria-required={field.required}
        minLength={field.min}
        maxLength={field.max}
      />
    );
  }

  return (
    <Input
      {...controllerField}
      className="text-sm/4"
      placeholder={placeholder}
      type="text"
      required={field.required}
      aria-required={field.required}
    />
  );
}
