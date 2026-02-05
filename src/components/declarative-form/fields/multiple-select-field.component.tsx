import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
  const minValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as { type: "min"; value: number | string } | undefined;

  const maxValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as { type: "max"; value: number | string } | undefined;

  const minSelections =
    typeof minValidator?.value === "number" ? minValidator.value : 0;
  const maxSelections =
    typeof maxValidator?.value === "number" ? maxValidator.value : undefined;

  // Watch the current value to show selection count
  const currentValue = useWatch({
    control: formControl,
    name: field.id,
  });

  const currentSelections = Array.isArray(currentValue) ? currentValue.length : 0;

  const getHelperText = () => {
    if (minSelections > 0 && maxSelections) {
      return `Select ${minSelections}-${maxSelections} options`;
    } else if (minSelections > 0) {
      return `Select at least ${minSelections} option${minSelections > 1 ? "s" : ""}`;
    } else if (maxSelections) {
      return `Select up to ${maxSelections} options`;
    }
    return "";
  };

  return (
    <div className="flex flex-col space-y-2">
      {getHelperText() && (
        <p className="text-sm text-gray-500">{getHelperText()}</p>
      )}
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
            const selections = selectedValues.length;

            return (
              <FormItem>
                <FormLabel
                  className={cn(
                    "bg-gray-50 border border-gray-200 flex font-normal gap-3 items-center min-h-[48px] leading-normal px-4 py-3 rounded-md text-base text-gray-900",
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
                          const newValue = [...selectedValues, option];
                          // Prevent exceeding max selections
                          if (
                            maxSelections &&
                            newValue.length > maxSelections
                          ) {
                            return;
                          }
                          formField.onChange(newValue);
                        } else {
                          formField.onChange(
                            selectedValues.filter((value) => value !== option)
                          );
                        }
                      }}
                      disabled={
                        !!(
                          maxSelections &&
                          !isChecked &&
                          selections >= maxSelections
                        )
                      }
                    />
                  </FormControl>
                  <span className="flex-1">{option}</span>
                </FormLabel>
              </FormItem>
            );
          }}
        />
      ))}
      {currentSelections > 0 && (
        <p className="text-sm text-gray-500">{currentSelections} selected</p>
      )}
    </div>
  );
}
