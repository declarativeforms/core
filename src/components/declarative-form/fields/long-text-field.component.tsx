import type { DeclarativeFieldComponentProps } from "../field-contract";
import { FormControl, Textarea } from "@/components/ui";

export function LongTextField({
  field,
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  return (
    <FormControl>
      <Textarea
        {...controllerField}
        className="h-32 md:h-50"
        placeholder={field.placeholder || "Your answer"}
        required={meta.isRequired}
        aria-required={meta.isRequired}
        minLength={
          typeof meta.minValidator?.value === "number"
            ? meta.minValidator.value
            : undefined
        }
        maxLength={
          typeof meta.maxValidator?.value === "number"
            ? meta.maxValidator.value
            : undefined
        }
      />
    </FormControl>
  );
}
