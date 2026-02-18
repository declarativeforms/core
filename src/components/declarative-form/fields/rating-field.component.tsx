import type { DeclarativeFieldComponentProps } from "../field-contract";
import { getRatingRange } from "../rating-range";
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
  meta,
}: DeclarativeFieldComponentProps) {
  const { min, max } = getRatingRange(meta);
  const values = Array.from({ length: max - min + 1 }, (_, index) =>
    String(min + index)
  );
  const selectedValue =
    controllerField.value === undefined || controllerField.value === null
      ? ""
      : String(controllerField.value);

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
          aria-required={meta.isRequired}
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

        {(field.min_label || field.max_label) && (
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{field.min_label || ""}</span>
            <span className="text-right">{field.max_label || ""}</span>
          </div>
        )}
      </div>
    </FormControl>
  );
}
