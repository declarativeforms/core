'use client';
import type { IRenderableDateField } from '@declarativeforms/engine';
import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function DateField(props: FieldProps<IRenderableDateField, string>) {
  const i18n = useI18n();

  return (
    <Input
      {...bindTextInput(props.control)}
      className="text-sm/4"
      placeholder={props.field.placeholder || i18n.t('input.placeholder')}
      type={props.field.inputType}
      required={props.field.required}
      aria-required={props.field.required}
      min={props.field.min}
      max={props.field.max}
    />
  );
}
