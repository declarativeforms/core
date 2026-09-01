'use client';

import { useState } from 'react';

import type { IRenderableMultipleSelectField } from '@declarativeforms/engine';

import { Checkbox, Field, FieldLabel, Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';
import type { FieldProps } from '../supporting/field.types';
import { HtmlText } from '../supporting/html-text';

const OPTION_ROW_CLASS =
  'border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors';

export function MultipleSelectField(
  props: FieldProps<IRenderableMultipleSelectField, Array<string>>,
) {
  const i18n = useI18n();
  const minSelections = props.field.min ?? 0;
  const maxSelections = props.field.max;

  const selected = Array.isArray(props.control.value)
    ? props.control.value
    : [];
  const optionValues = new Set(
    props.field.options?.map((option) => option.value) ?? [],
  );

  const chosenOptions = selected.filter((value) => optionValues.has(value));
  const otherValue = selected.find((value) => !optionValues.has(value));
  const isOtherChecked = otherValue !== undefined;

  const [otherText, setOtherText] = useState(otherValue ?? '');

  const helperTextId = `multiselect-helper-${props.field.id}`;
  const helperText = (() => {
    if (minSelections > 0 && maxSelections) {
      return i18n.t('multiple_select.range', {
        min: String(minSelections),
        max: String(maxSelections),
      });
    }
    if (minSelections > 0) {
      return i18n.t('multiple_select.at_least', { min: String(minSelections) });
    }
    if (maxSelections) {
      return i18n.t('multiple_select.up_to', { max: String(maxSelections) });
    }
    return '';
  })();

  const isFull = !!maxSelections && selected.length >= maxSelections;

  function commit(next: Array<string>): void {
    if (maxSelections && next.length > maxSelections) {
      return;
    }
    props.control.onChange(next);
  }

  return (
    <div
      className="flex flex-col space-y-2"
      role="group"
      aria-label={stripHtml(props.field.label)}
      aria-required={props.field.required}
      aria-describedby={helperText ? helperTextId : undefined}
    >
      {helperText && (
        <p id={helperTextId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {props.field.options?.map((option) => {
        const isChecked = selected.includes(option.value);

        return (
          <Field key={option.value}>
            <FieldLabel
              className={cn(OPTION_ROW_CLASS, { 'border-ring': isChecked })}
            >
              <Checkbox
                checked={isChecked}
                disabled={!isChecked && isFull}
                onCheckedChange={(checked: boolean) =>
                  commit(
                    checked
                      ? [...selected, option.value]
                      : selected.filter((value) => value !== option.value),
                  )
                }
              />
              <HtmlText html={option.label} className="flex-1" />
            </FieldLabel>
          </Field>
        );
      })}

      {props.field.allowOther && (
        <Field>
          <FieldLabel
            className={cn(OPTION_ROW_CLASS, { 'border-ring': isOtherChecked })}
          >
            <Checkbox
              checked={isOtherChecked}
              disabled={!isOtherChecked && isFull}
              onCheckedChange={(checked: boolean) => {
                if (checked) {
                  commit([...chosenOptions, otherText]);
                  return;
                }
                setOtherText('');
                commit(chosenOptions);
              }}
            />
            <span className="flex-1">{i18n.t('select.other')}</span>
          </FieldLabel>
          {isOtherChecked && (
            <Input
              className="mt-2 text-sm/4"
              placeholder={i18n.t('select.other_placeholder')}
              value={otherText}
              onChange={(event) => {
                setOtherText(event.target.value);
                commit([...chosenOptions, event.target.value]);
              }}
              autoFocus
            />
          )}
        </Field>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {selected.length > 0
          ? i18n.t('multiple_select.selected_count', {
              count: String(selected.length),
            })
          : ''}
      </p>
    </div>
  );
}
