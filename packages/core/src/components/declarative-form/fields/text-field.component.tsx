'use client';
import type { IRenderableTextField } from '@declarativeforms/engine';
import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function TextField(props: FieldProps<IRenderableTextField, string>) {
  const i18n = useI18n();

  return (
    <Input
      {...bindTextInput(props.control)}
      className="text-sm/4"
      placeholder={props.field.placeholder || i18n.t('input.placeholder')}
      type={props.field.inputType}
      required={props.field.required}
      aria-required={props.field.required}
      minLength={props.field.min}
      maxLength={props.field.max}
    />
  );
}
