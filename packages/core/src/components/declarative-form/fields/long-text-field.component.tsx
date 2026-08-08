import type { IRenderableLongTextField } from '@declarativeforms/engine';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { Textarea } from '@/components/ui';
import { useI18n } from '@/i18n';

export function LongTextField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps<IRenderableLongTextField>) {
  const { t } = useI18n();

  return (
    <Textarea
      {...controllerField}
      className="h-32 md:h-50 text-sm/4"
      placeholder={field.placeholder || t('long_text.placeholder')}
      required={field.required}
      aria-required={field.required}
      minLength={field.min}
      maxLength={field.max}
    />
  );
}
