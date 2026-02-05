import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { FormControl, Input } from "@/components/ui";
import type { IDeclarativeFormField } from "../types";

export function InputField({
  field,
  formField,
  type,
}: {
  field: IDeclarativeFormField;
  formField: ControllerRenderProps<FieldValues, string>;
  type: string;
}) {
  const minValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "min"
  ) as { type: "min"; value: number | string } | undefined;

  const maxValidator = field.validators?.find(
    (v) => typeof v === "object" && v.type === "max"
  ) as { type: "max"; value: number | string } | undefined;

  return (
    <FormControl>
      <Input
        {...formField}
        className="bg-gray-50 border border-gray-200 focus:border-gray-300 h-auto leading-normal py-3 px-4 shadow-none text-base text-gray-900 w-full placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
        type={type}
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
