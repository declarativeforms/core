'use client';

import type { IRenderableTextField } from '@declarativeforms/engine';

import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { bindTextInput } from '../supporting/bind-text-input';
import type { FieldProps } from '../supporting/field.types';

/** Single-line free text: `short_text`, `url`, `mobile_number`. */
export function TextField({
  field,
  control,
}: FieldProps<IRenderableTextField, string>) {
  const { t } = useI18n();

  return (
    <Input
      {...bindTextInput(control)}
      className="text-sm/4"
      placeholder={field.placeholder || t('input.placeholder')}
      type={field.inputType}
      required={field.required}
      aria-required={field.required}
      minLength={field.min}
      maxLength={field.max}
    />
  );
}
