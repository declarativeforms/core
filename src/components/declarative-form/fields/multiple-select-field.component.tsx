import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { IDeclarativeFormField } from "../types";

export function MultipleSelectField({
  field,
  formControl,
}: {
  field: IDeclarativeFormField;
  formControl: UseFormReturn<FieldValues>["control"];
}) {
  return (
    <div className="flex flex-col space-y-2">
      {field.options?.map((option) => (
        <FormField
          key={option}
          control={formControl}
          name={field.id}
          render={({ field: formField }) => {
            const selectedValues = Array.isArray(formField.value)
              ? formField.value
              : [];
            const isChecked = selectedValues.includes(option);

            return (
              <FormItem>
                <FormLabel
                  className={cn(
                    "bg-gray-50 border-1 border-gray-200 flex font-normal gap-3 h-14 leading-tight px-4 rounded-md text-base text-gray-900",
                    {
                      "border-gray-900": isChecked,
                    }
                  )}
                >
                  <FormControl>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          formField.onChange([...selectedValues, option]);
                        } else {
                          formField.onChange(
                            selectedValues.filter((value) => value !== option)
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <span className="flex-1">
                    {option}
                  </span>
                </FormLabel>
              </FormItem>
            );
          }}
        />
      ))}
    </div>
  );
}
