import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui";
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
                  className={`flex items-center space-x-3 w-full border rounded-md p-3 cursor-pointer transition-all duration-200 shadow-sm ${
                    isChecked
                      ? "border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
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
                  <span className="font-normal text-sm text-neutral-700 select-none flex-1">
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
