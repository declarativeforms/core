import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { fieldOptionClass } from "../field-styles";
import type { IDeclarativeFormField } from "../types";
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
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  const isRequired = field.validators?.some((v) => v === "required");

  return (
    <FormControl>
      <RadioGroup
        onValueChange={formField.onChange}
        defaultValue={formField.value}
        className="gap-2"
        aria-required={!!isRequired}
      >
        {field.options?.map((option) => {
          const isSelected = formField.value === option;

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
