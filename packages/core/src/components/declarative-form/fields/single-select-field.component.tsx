'use client';
import { useState } from 'react';
import type { IRenderableSingleSelectField } from '@declarativeforms/engine';
import {
  HtmlText,
  type FieldProps,
} from '@/components/declarative-form/supporting';
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

export function SingleSelectField(
  props: FieldProps<IRenderableSingleSelectField, string>,
) {
  const i18n = useI18n();

  const [other, setOther] = useState(() => {
    const active =
      !!props.field.allowOther &&
      !!props.control.value &&
      !props.field.options?.some((o) => o.value === props.control.value);

    return { active, text: active ? String(props.control.value) : '' };
  });

  const handleValueChange = (value: string): void => {
    if (value === OTHER_VALUE) {
      setOther((o) => ({ ...o, active: true }));
      props.control.onChange(other.text || '');
    } else {
      setOther((o) => ({ ...o, active: false }));
      props.control.onChange(value);
    }
  };

  const handleOtherTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const text = e.target.value;
    setOther((o) => ({ ...o, text }));
    props.control.onChange(text);
  };

  const radioValue = other.active ? OTHER_VALUE : props.control.value;

  return (
    <RadioGroup
      onValueChange={handleValueChange}
      value={radioValue}
      className="gap-2"
      aria-required={props.field.required}
    >
      {props.field.options?.map((option) => {
        const isSelected = props.control.value === option.value;

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
      {props.field.allowOther && (
        <Field>
          <FieldLabel
            className={cn(
              'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
              { 'border-ring': other.active },
            )}
          >
            <RadioGroupItem value={OTHER_VALUE} />
            <span>{i18n.t('select.other')}</span>
          </FieldLabel>
          {other.active && (
            <Input
              className="mt-2 text-sm/4"
              placeholder={i18n.t('select.other_placeholder')}
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
