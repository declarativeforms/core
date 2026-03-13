import type { DeclarativeFieldComponentProps } from "../renderer/field-contract";
import { HtmlText } from "../renderer/html-text";
import { getRatingRange } from "./rating-range";
import {
  FormControl,
  FormItem,
  FormLabel,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export function RatingField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { min, max } = getRatingRange(field.validation);
  const values = Array.from({ length: max - min + 1 }, (_, index) =>
    String(min + index)
  );
  const selectedValue =
    controllerField.value === undefined || controllerField.value === null
      ? ""
      : String(controllerField.value);

  const minLabel = "min_label" in field ? field.min_label : undefined;
  const maxLabel = "max_label" in field ? field.max_label : undefined;
  const hasLabels = !!(minLabel || maxLabel);
  const labelsId = `rating-labels-${field.id}`;

  return (
    <FormControl>
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
              <FormItem key={value}>
                <FormLabel
                  className={cn(
                    "h-9 min-w-9 w-full rounded-md border border-input px-3 cursor-pointer hover:bg-muted/50 transition-colors inline-flex items-center justify-center",
                    { "border-ring bg-muted/60": isSelected }
                  )}
                >
                  <FormControl>
                    <RadioGroupItem value={value} className="sr-only" />
                  </FormControl>
                  <span className="text-sm/4">{value}</span>
                </FormLabel>
              </FormItem>
            );
          })}
        </RadioGroup>

        {hasLabels && (
          <div id={labelsId} className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <HtmlText html={minLabel || ""} />
            <HtmlText html={maxLabel || ""} className="text-right" />
          </div>
        )}
      </div>
    </FormControl>
  );
}
