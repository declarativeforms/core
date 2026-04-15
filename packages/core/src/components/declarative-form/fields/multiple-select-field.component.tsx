import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { buildFieldValidation } from '../supporting/validation';
import { HtmlText } from '../supporting/html-text';
import { stripHtml } from '@declarativeforms/common';
import { Checkbox, Field, FieldLabel, Input } from '@/components/ui';
import { Controller } from 'react-hook-form';
import { useFormI18n } from '../supporting/use-form-i18n';
import { cn } from '@/lib/utils';

export function MultipleSelectField({
  field,
  form,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const { minBound, maxBound, options } = buildFieldValidation(field);
  const minSelections = minBound ?? 0;
  const maxSelections = maxBound;
  const allowOther = 'allow_other' in field && field.allow_other;

  // Watch the current value to show selection count
  const currentValue = useWatch({
    control: form.control,
    name: field.id,
  });

  const currentSelections = Array.isArray(currentValue)
    ? currentValue.length
    : 0;

  const helperTextId = `multiselect-helper-${field.id}`;
  const optionValues = new Set(options?.map((o) => o.value) ?? []);

  // Find the "other" text value in the current selections
  const currentOtherValue = Array.isArray(currentValue)
    ? currentValue.find((v: string) => !optionValues.has(v))
    : undefined;

  const [otherText, setOtherText] = useState<string>(
    currentOtherValue ? String(currentOtherValue) : '',
  );
  const isOtherChecked = currentOtherValue !== undefined;

  const getHelperText = () => {
    if (minSelections > 0 && maxSelections) {
      return t('multiple_select.range', {
        min: String(minSelections),
        max: String(maxSelections),
      });
    } else if (minSelections > 0) {
      return t('multiple_select.at_least', {
        min: String(minSelections),
      });
    } else if (maxSelections) {
      return t('multiple_select.up_to', {
        max: String(maxSelections),
      });
    }
    return '';
  };

  const helperText = getHelperText();

  return (
    <div
      className="flex flex-col space-y-2"
      role="group"
      aria-label={stripHtml(field.label)}
      aria-required={field.required}
      aria-describedby={helperText ? helperTextId : undefined}
    >
      {helperText && (
        <p id={helperTextId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
      {options?.map((option) => (
        <Controller
          key={option.value}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => {
            const selectedValues = Array.isArray(formField.value)
              ? formField.value
              : [];
            const isChecked = selectedValues.includes(option.value);
            const selections = selectedValues.length;

            return (
              <Field>
                <FieldLabel
                  className={cn(
                    'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
                    { 'border-ring': isChecked },
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        const newValue = [...selectedValues, option.value];
                        // Prevent exceeding max selections
                        if (maxSelections && newValue.length > maxSelections) {
                          return;
                        }
                        formField.onChange(newValue);
                      } else {
                        formField.onChange(
                          selectedValues.filter(
                            (value) => value !== option.value,
                          ),
                        );
                      }
                    }}
                    disabled={
                      !!(
                        maxSelections &&
                        !isChecked &&
                        selections >= maxSelections
                      )
                    }
                  />
                  <HtmlText html={option.label} className="flex-1" />
                </FieldLabel>
              </Field>
            );
          }}
        />
      ))}
      {allowOther && (
        <Controller
          control={form.control}
          name={field.id}
          render={({ field: formField }) => {
            const selectedValues = Array.isArray(formField.value)
              ? formField.value
              : [];
            const selections = selectedValues.length;

            return (
              <Field>
                <FieldLabel
                  className={cn(
                    'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
                    { 'border-ring': isOtherChecked },
                  )}
                >
                  <Checkbox
                    checked={isOtherChecked}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        const text = otherText || '';
                        const newValue = [
                          ...selectedValues.filter((v: string) =>
                            optionValues.has(v),
                          ),
                          text,
                        ];
                        if (maxSelections && newValue.length > maxSelections) {
                          return;
                        }
                        formField.onChange(newValue);
                      } else {
                        formField.onChange(
                          selectedValues.filter((v: string) =>
                            optionValues.has(v),
                          ),
                        );
                        setOtherText('');
                      }
                    }}
                    disabled={
                      !!(
                        maxSelections &&
                        !isOtherChecked &&
                        selections >= maxSelections
                      )
                    }
                  />
                  <span className="flex-1">{t('select.other')}</span>
                </FieldLabel>
                {isOtherChecked && (
                  <Input
                    className="mt-2 text-sm/4"
                    placeholder={t('select.other_placeholder')}
                    value={otherText}
                    onChange={(e) => {
                      const text = e.target.value;
                      setOtherText(text);
                      const withoutOther = selectedValues.filter((v: string) =>
                        optionValues.has(v),
                      );
                      formField.onChange([...withoutOther, text]);
                    }}
                    autoFocus
                  />
                )}
              </Field>
            );
          }}
        />
      )}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {currentSelections > 0
          ? t('multiple_select.selected_count', {
              count: String(currentSelections),
            })
          : ''}
      </p>
    </div>
  );
}
