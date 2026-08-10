import { Input } from '@/components/ui';
import type { IRenderableEmailField } from '@declarativeforms/engine';

import { useI18n } from '@/i18n';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support.types';

export function EmailField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps<IRenderableEmailField>) {
  const { t } = useI18n();

  return (
    <Input
      {...controllerField}
      className="text-sm/4"
      placeholder={field.placeholder || t('email.placeholder_default')}
      type="email"
      required={field.required}
      aria-required={field.required}
      minLength={field.min}
      maxLength={field.max}
    />
  );
}
