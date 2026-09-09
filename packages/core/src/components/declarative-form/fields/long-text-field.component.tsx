'use client';
import type { IRenderableLongTextField } from '@declarativeforms/engine';
import { Textarea } from '@/components/ui';
import { useI18n } from '@/i18n';
import {
  bindTextInput,
  type FieldProps,
} from '@/components/declarative-form/supporting';

export function LongTextField(
  props: FieldProps<IRenderableLongTextField, string>,
) {
  const i18n = useI18n();

  return (
    <Textarea
      {...bindTextInput(props.control)}
      className="h-32 md:h-50 text-sm/4"
      placeholder={props.field.placeholder || i18n.t('long_text.placeholder')}
      required={props.field.required}
      aria-required={props.field.required}
      minLength={props.field.min}
      maxLength={props.field.max}
    />
  );
}
