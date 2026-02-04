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
        className="gap-2"
      >
        {field.options?.map((option) => {
          const isSelected = formField.value === option;

          return (
            <FormItem key={option}>
              <FormLabel
                className={cn(
                  "bg-gray-50 border border-gray-200 flex font-normal gap-3 items-center min-h-[48px] leading-normal px-4 py-3 rounded-md text-base text-gray-900",
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
