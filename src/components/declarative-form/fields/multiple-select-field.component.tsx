import { useWatch } from "react-hook-form";

import { fieldHelperClass, fieldOptionClass } from "../field-styles";
import type { DeclarativeFieldComponentProps } from "../field-contract";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export function MultipleSelectField({
  field,
  form,
  meta,
}: DeclarativeFieldComponentProps) {
  const minSelections =
    typeof meta.minValidator?.value === "number" ? meta.minValidator.value : 0;
  const maxSelections =
    typeof meta.maxValidator?.value === "number"
      ? meta.maxValidator.value
      : undefined;

  // Watch the current value to show selection count
  const currentValue = useWatch({
    control: form.control,
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
    <div className="flex flex-col space-y-2" role="group" aria-required={meta.isRequired}>
        {getHelperText() && (
        <p className={fieldHelperClass}>{getHelperText()}</p>
      )}
      {field.options?.map((option) => (
        <FormField
          key={option}
          control={form.control}
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
                    fieldOptionClass,
                    {
                      "border-ring": isChecked,
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
        <p className={fieldHelperClass}>{currentSelections} selected</p>
      )}
    </div>
  );
}
