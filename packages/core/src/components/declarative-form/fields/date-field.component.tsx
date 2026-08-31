'use client';

import type { IRenderableDateField } from '@declarativeforms/engine';

import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { bindTextInput } from '../supporting/bind-text-input';
import type { FieldProps } from '../supporting/field.types';

/**
 * A point in time: `date`, `date_month` or `time`. `min`/`max` are ISO strings
 * the native control understands directly.
 */
export function DateField({
  field,
  control,
}: FieldProps<IRenderableDateField, string>) {
  const { t } = useI18n();

  return (
    <Input
      {...bindTextInput(control)}
      className="text-sm/4"
      placeholder={field.placeholder || t('input.placeholder')}
      type={field.inputType}
      required={field.required}
      aria-required={field.required}
      min={field.min}
      max={field.max}
    />
  );
}
