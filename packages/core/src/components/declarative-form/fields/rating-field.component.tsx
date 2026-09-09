'use client';
import type { IRenderableRatingField } from '@declarativeforms/engine';
import {
  HtmlText,
  type FieldProps,
} from '@/components/declarative-form/supporting';
import { Field, FieldLabel, RadioGroup, RadioGroupItem } from '@/components/ui';
import { stripHtml } from '@/lib/strip-html';
import { cn } from '@/lib/utils';

export function RatingField(props: FieldProps<IRenderableRatingField, string>) {
  const min = props.field.min ?? 1;
  const max = props.field.max ?? 5;
  const values = Array.from({ length: max - min + 1 }, (_, index) =>
    String(min + index),
  );
  const selectedValue =
    props.control.value === undefined || props.control.value === null
      ? ''
      : String(props.control.value);

  const minLabel = props.field.minLabel;
  const maxLabel = props.field.maxLabel;
  const hasLabels = !!(minLabel || maxLabel);
  const labelsId = `rating-labels-${props.field.id}`;

  return (
    <div className="space-y-2">
      <RadioGroup
        onValueChange={props.control.onChange}
        value={selectedValue}
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
        }}
        aria-label={stripHtml(props.field.label)}
        aria-required={props.field.required}
        aria-describedby={hasLabels ? labelsId : undefined}
      >
        {values.map((value) => {
          const isSelected = selectedValue === value;

          return (
            <Field key={value}>
              <FieldLabel
                className={cn(
                  'h-9 min-w-9 w-full rounded-md border border-input px-3 cursor-pointer hover:bg-muted/50 transition-colors inline-flex items-center justify-center',
                  { 'border-ring bg-muted/60': isSelected },
                )}
              >
                <RadioGroupItem value={value} className="sr-only" />
                <span className="text-sm/4">{value}</span>
              </FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>

      {hasLabels && (
        <div
          id={labelsId}
          className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
        >
          <HtmlText html={minLabel || ''} />
          <HtmlText html={maxLabel || ''} className="text-right" />
        </div>
      )}
    </div>
  );
}
