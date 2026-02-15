import type { DeclarativeFieldComponentProps } from "../field-contract";
import { FormControl, Input } from "@/components/ui";

export function InputField({
  field,
  controllerField,
  meta,
}: DeclarativeFieldComponentProps) {
  const inputType =
    field.type === "date"
      ? "date"
      : field.type === "email"
      ? "email"
      : field.type === "mobile_number"
      ? "tel"
      : field.type === "number"
      ? "text"
      : field.type === "url"
      ? "url"
      : "text";

  return (
    <FormControl>
      <Input
        {...controllerField}
        className="text-sm/4"
        placeholder={field.placeholder || "Your answer"}
        type={inputType}
        inputMode={field.type === "number" ? "numeric" : undefined}
        pattern={
          field.type === "number" && !meta.hasPatternValidator
            ? "^[0-9]+$"
            : undefined
        }
        required={meta.isRequired}
        aria-required={meta.isRequired}
        minLength={
          field.type !== "date" && typeof meta.minValidator?.value === "number"
            ? meta.minValidator.value
            : undefined
        }
        maxLength={
          field.type !== "date" && typeof meta.maxValidator?.value === "number"
            ? meta.maxValidator.value
            : undefined
        }
        min={
          field.type === "date" && typeof meta.minValidator?.value === "string"
            ? meta.minValidator.value
            : undefined
        }
        max={
          field.type === "date" && typeof meta.maxValidator?.value === "string"
            ? meta.maxValidator.value
            : undefined
        }
      />
    </FormControl>
  );
}
