import type { HTMLAttributes } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import { fieldControlClass } from "../field-styles";
import type { IDeclarativeFormField } from "../types";
import { FormControl, Input } from "@/components/ui";

export function InputField({
  field,
  formField,
  type,
  inputMode,
  pattern,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
  type: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}) {
  const minValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as { type: "min"; value: number | string } | undefined;

  const maxValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as { type: "max"; value: number | string } | undefined;

  const isRequired = field.validators?.some((v) => v === "required");

  return (
    <FormControl>
      <Input
        {...formField}
        className={fieldControlClass}
        placeholder={field.placeholder || "Your answer"}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        required={!!isRequired}
        aria-required={!!isRequired}
        minLength={
          type !== "date" && typeof minValidator?.value === "number"
            ? minValidator.value
            : undefined
        }
        maxLength={
          type !== "date" && typeof maxValidator?.value === "number"
            ? maxValidator.value
            : undefined
        }
        min={
          type === "date" && typeof minValidator?.value === "string"
            ? minValidator.value
            : undefined
        }
        max={
          type === "date" && typeof maxValidator?.value === "string"
            ? maxValidator.value
            : undefined
        }
      />
    </FormControl>
  );
}
