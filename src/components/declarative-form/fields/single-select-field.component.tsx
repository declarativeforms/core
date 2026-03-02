import type { DeclarativeFieldComponentProps } from "../renderer/field-contract";
import {
  FormControl,
  FormItem,
  FormLabel,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export function SingleSelectField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const options = "options" in field ? field.options : undefined;

  return (
    <FormControl>
      <RadioGroup
        onValueChange={controllerField.onChange}
        value={controllerField.value}
        className="gap-2"
        aria-required={field.required}
      >
        {options?.map((option) => {
          const isSelected = controllerField.value === option.value;

          return (
            <FormItem key={option.value}>
              <FormLabel
                className={cn(
                  "border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                  { "border-ring": isSelected }
                )}
              >
                <FormControl>
                  <RadioGroupItem value={option.value} />
                </FormControl>
                <span>{option.label}</span>
              </FormLabel>
            </FormItem>
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}
