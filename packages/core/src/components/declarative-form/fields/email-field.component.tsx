'use client';
import type { IRenderableEmailField } from '@declarativeforms/engine';
import { Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function EmailField(props: FieldProps<IRenderableEmailField, string>) {
  const i18n = useI18n();

  return (
    <Input
      {...bindTextInput(props.control)}
      className="text-sm/4"
      placeholder={
        props.field.placeholder || i18n.t('email.placeholder_default')
      }
      type="email"
      required={props.field.required}
      aria-required={props.field.required}
      minLength={props.field.min}
      maxLength={props.field.max}
    />
  );
}
