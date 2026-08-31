'use client';

import type { IRenderableNumberField } from '@declarativeforms/engine';

import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { bindTextInput } from '../supporting/bind-text-input';
import type { FieldProps } from '../supporting/field.types';

/**
 * A numeric answer. Rendered as `type="text"` with a numeric input mode rather
 * than `type="number"`: the answer is stored as a string, and the engine's
 * bounds run over it as rules, so the native spinner and its browser-specific
 * coercion buy nothing.
 */
export function NumberField({
  field,
  control,
}: FieldProps<IRenderableNumberField, string>) {
  const { t } = useI18n();

  return (
    <Input
      {...bindTextInput(control)}
      className="text-sm/4"
      placeholder={field.placeholder || t('input.placeholder')}
      type="text"
      inputMode="numeric"
      pattern={field.integer ? '^[0-9]+$' : undefined}
      required={field.required}
      aria-required={field.required}
    />
  );
}
