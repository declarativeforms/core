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
  return (
    <FormControl>
      <Input
        {...formField}
        className="bg-gray-50 h-11 leading-6 px-3.5 shadow-none text-base text-gray-900 w-full placeholder:leading-6 placeholder:text-gray-400"
        placeholder={field.placeholder || "Your answer"}
        type={type}
      />
    </FormControl>
  );
}
