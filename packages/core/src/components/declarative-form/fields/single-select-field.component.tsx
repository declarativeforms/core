'use client';

import { useState } from 'react';

import type { IRenderableSingleSelectField } from '@declarativeforms/engine';
import type { FieldProps } from '../supporting/field.types';
import { HtmlText } from '../supporting/html-text';
import {
  Field,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

const OTHER_VALUE = '__other__';

export function SingleSelectField({
  field,
  control,
}: FieldProps<IRenderableSingleSelectField, string>) {
  const { t } = useI18n();
  const { options, allowOther } = field;

  const [other, setOther] = useState(() => {
    const active =
      !!allowOther &&
      !!control.value &&
      !options?.some((o) => o.value === control.value);
    return { active, text: active ? String(control.value) : '' };
  });

  const handleValueChange = (value: string) => {
    if (value === OTHER_VALUE) {
      setOther((o) => ({ ...o, active: true }));
      control.onChange(other.text || '');
    } else {
      setOther((o) => ({ ...o, active: false }));
      control.onChange(value);
    }
  };

  const handleOtherTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setOther((o) => ({ ...o, text }));
    control.onChange(text);
  };

  const radioValue = other.active ? OTHER_VALUE : control.value;

  return (
    <RadioGroup
      onValueChange={handleValueChange}
      value={radioValue}
      className="gap-2"
      aria-required={field.required}
    >
      {options?.map((option) => {
        const isSelected = control.value === option.value;

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
              { 'border-ring': other.active },
            )}
          >
            <RadioGroupItem value={OTHER_VALUE} />
            <span>{t('select.other')}</span>
          </FieldLabel>
          {other.active && (
            <Input
              className="mt-2 text-sm/4"
              placeholder={t('select.other_placeholder')}
              value={other.text}
              onChange={handleOtherTextChange}
              autoFocus
            />
          )}
        </Field>
      )}
    </RadioGroup>
  );
}
