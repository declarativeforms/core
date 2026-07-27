import type { DeclarativeFieldComponentProps } from '../supporting/field-support';
import { HtmlText } from '../supporting/html-text';
import { buildFieldValidation } from '../supporting/validation';
import { Field, FieldLabel, RadioGroup, RadioGroupItem } from '../../ui';
import { cn } from '../../../lib/utils';

export function RatingField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { ratingRange } = buildFieldValidation(field);
  const { min, max } = ratingRange ?? { min: 1, max: 5 };
  const values = Array.from({ length: max - min + 1 }, (_, index) =>
    String(min + index),
  );
  const selectedValue =
    controllerField.value === undefined || controllerField.value === null
      ? ''
      : String(controllerField.value);

  const minLabel = 'min_label' in field ? field.min_label : undefined;
  const maxLabel = 'max_label' in field ? field.max_label : undefined;
  const hasLabels = !!(minLabel || maxLabel);
  const labelsId = `rating-labels-${field.id}`;

  return (
    <div className="space-y-2">
      <RadioGroup
        onValueChange={controllerField.onChange}
        value={selectedValue}
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
        }}
        aria-label={field.label}
        aria-required={field.required}
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
