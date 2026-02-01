import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { IDeclarativeFormField } from "../types";

export function SingleSelectField({
  field,
  formField,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
}) {
  return (
    <FormControl>
      <RadioGroup
        onValueChange={formField.onChange}
        defaultValue={formField.value}
      >
        {field.options?.map((option) => {
          const isSelected = formField.value === option;

          return (
            <FormItem key={option}>
              <FormLabel
                className={cn(
                  "bg-gray-50 border-1 border-gray-200 flex font-normal gap-3 h-11 leading-6 px-3.5 rounded-md text-base text-gray-900",
                  {
                    "border-gray-900": isSelected,
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
