import { fieldOptionClass } from "../field-styles";
import type { DeclarativeFieldComponentProps } from "../field-contract";
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
  meta,
}: DeclarativeFieldComponentProps) {

  return (
    <FormControl>
      <RadioGroup
        onValueChange={controllerField.onChange}
        defaultValue={controllerField.value}
        className="gap-2"
        aria-required={meta.isRequired}
      >
        {field.options?.map((option) => {
          const isSelected = controllerField.value === option;

          return (
            <FormItem key={option}>
              <FormLabel
                className={cn(
                  fieldOptionClass,
                  {
                    "border-ring": isSelected,
                  }
                )}
              >
                <FormControl>
                  <RadioGroupItem value={option} />
                </FormControl>
                <span>{option}</span>
              </FormLabel>
            </FormItem>
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}
