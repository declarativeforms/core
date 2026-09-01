'use client';
import type { IRenderableNumberField } from '@declarativeforms/engine';
import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function NumberField(props: FieldProps<IRenderableNumberField, string>) {
  const i18n = useI18n();

  return (
    <Input
      {...bindTextInput(props.control)}
      className="text-sm/4"
      placeholder={props.field.placeholder || i18n.t('input.placeholder')}
      type="text"
      inputMode="numeric"
      pattern={props.field.integer ? '^[0-9]+$' : undefined}
      required={props.field.required}
      aria-required={props.field.required}
    />
  );
}
