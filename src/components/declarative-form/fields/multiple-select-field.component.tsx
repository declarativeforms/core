import { useWatch } from "react-hook-form";

import type { DeclarativeFieldComponentProps } from "../renderer/field-contract";
import { findValidationRule } from "../renderer/field-contract";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui";
import { useFormI18n } from "../renderer/use-form-i18n";
import { cn } from "@/lib/utils";

export function MultipleSelectField({
  field,
  form,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const minRule = findValidationRule(field.validation, "min");
  const maxRule = findValidationRule(field.validation, "max");
  const minSelections =
    minRule && typeof minRule.value === "number" ? minRule.value : 0;
  const maxSelections =
    maxRule && typeof maxRule.value === "number" ? maxRule.value : undefined;

  // Watch the current value to show selection count
  const currentValue = useWatch({
    control: form.control,
    name: field.id,
  });

  const currentSelections = Array.isArray(currentValue)
    ? currentValue.length
    : 0;

  const helperTextId = `multiselect-helper-${field.id}`;

  const getHelperText = () => {
    if (minSelections > 0 && maxSelections) {
      return t("multiple_select.range", {
        min: String(minSelections),
        max: String(maxSelections),
      });
    } else if (minSelections > 0) {
      return t("multiple_select.at_least", {
        min: String(minSelections),
      });
    } else if (maxSelections) {
      return t("multiple_select.up_to", {
        max: String(maxSelections),
      });
    }
    return "";
  };

  const helperText = getHelperText();
  const options = "options" in field ? field.options : undefined;

  return (
    <div
      className="flex flex-col space-y-2"
      role="group"
      aria-label={field.label}
      aria-required={field.required}
      aria-describedby={helperText ? helperTextId : undefined}
    >
      {helperText && <p id={helperTextId} className="text-sm text-muted-foreground">{helperText}</p>}
      {options?.map((option) => (
        <FormField
          key={option.value}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => {
            const selectedValues = Array.isArray(formField.value)
              ? formField.value
              : [];
            const isChecked = selectedValues.includes(option.value);
            const selections = selectedValues.length;

            return (
              <FormItem>
                <FormLabel
                  className={cn(
                    "border border-input rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                    { "border-ring": isChecked }
                  )}
                >
                  <FormControl>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          const newValue = [...selectedValues, option.value];
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
                            selectedValues.filter(
                              (value) => value !== option.value
                            )
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
                  <span className="flex-1">{option.label}</span>
                </FormLabel>
              </FormItem>
            );
          }}
        />
      ))}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {currentSelections > 0
          ? t("multiple_select.selected_count", {
              count: String(currentSelections),
            })
          : ""}
      </p>
    </div>
  );
}
