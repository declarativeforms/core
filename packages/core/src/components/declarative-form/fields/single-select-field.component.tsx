import { useState } from 'react';

import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { buildFieldValidation } from '../supporting/validation';
import { HtmlText } from '../supporting/html-text';
import {
  Field,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useFormI18n } from '../supporting/use-form-i18n';

const OTHER_VALUE = '__other__';

export function SingleSelectField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const { options } = buildFieldValidation(field);
  const allowOther = 'allow_other' in field && field.allow_other;

  const [isOtherMode, setIsOtherMode] = useState(
    () =>
      allowOther &&
      !!controllerField.value &&
      !options?.some((o) => o.value === controllerField.value),
  );

  const [otherText, setOtherText] = useState<string>(
    isOtherMode ? String(controllerField.value) : '',
  );

  const handleValueChange = (value: string) => {
    if (value === OTHER_VALUE) {
      setIsOtherMode(true);
      controllerField.onChange(otherText || '');
    } else {
      setIsOtherMode(false);
      controllerField.onChange(value);
    }
  };

  const handleOtherTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setOtherText(text);
    controllerField.onChange(text);
  };

  const radioValue = isOtherMode ? OTHER_VALUE : controllerField.value;

  return (
    <RadioGroup
      onValueChange={handleValueChange}
      value={radioValue}
      className="gap-2"
      aria-required={field.required}
    >
      {options?.map((option) => {
        const isSelected = controllerField.value === option.value;

        return (
          <Field key={option.value}>
            <FieldLabel
              className={cn(
                'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
                { 'border-ring': isSelected },
              )}
            >
              <RadioGroupItem value={option.value} />
              <HtmlText html={option.label} />
            </FieldLabel>
          </Field>
        );
      })}
      {allowOther && (
        <Field>
          <FieldLabel
            className={cn(
              'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
              { 'border-ring': isOtherMode },
            )}
          >
            <RadioGroupItem value={OTHER_VALUE} />
            <span>{t('select.other')}</span>
          </FieldLabel>
          {isOtherMode && (
            <Input
              className="mt-2 text-sm/4"
              placeholder={t('select.other_placeholder')}
              value={otherText}
              onChange={handleOtherTextChange}
              autoFocus
            />
          )}
        </Field>
      )}
    </RadioGroup>
  );
}
