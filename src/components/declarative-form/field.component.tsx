import {
  useWatch,
  type FieldValues,
  type RegisterOptions,
  type UseFormReturn,
} from "react-hook-form";
import {
  DropdownField,
  InputField,
  LongTextField,
  MultipleSelectField,
  SingleSelectField,
} from "./fields";
import type { IDeclarativeFormField } from "./types";
import { FormField, FormItem, FormLabel } from "../ui";

export function DeclarativeFormField(props: {
  field: IDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
}) {
  const formData = useWatch({ control: props.form.control });

  const isVisible = (() => {
    if (!props.field.visible_when) {
      return true;
    }

    const condition = new Function(
      "data",
      `return ${props.field.visible_when}`
    );

    return condition(formData);
  })();

  if (!isVisible) {
    return null;
  }

  const isRequired = props.field.validators?.includes("required");

  const rules: RegisterOptions = {};

  if (isRequired) {
    rules.required = `${props.field.label} is required.`;
  }

  const Label = () => (
    <FormLabel className="block text-sm font-medium text-neutral-900 mb-2">
      {props.field.label}
      {isRequired && (
        <span className="text-red-500 ml-1 font-normal" aria-hidden="true">
          *
        </span>
      )}
    </FormLabel>
  );

  return (
    <FormField
      control={props.form.control}
      name={props.field.id}
      rules={rules}
      render={({ field }) => (
        <FormItem className="mb-6 group">
          {Label()}
          {props.field.type === "date" ? (
            <InputField field={props.field} formField={field} type="date" />
          ) : null}
          {props.field.type === "dropdown" ? (
            <DropdownField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "email" ? (
            <InputField field={props.field} formField={field} type="email" />
          ) : null}
          {props.field.type === "long_text" ? (
            <LongTextField field={props.field} formField={field} />
          ) : null}
          {props.field.type === "multiple_select" ? (
            <MultipleSelectField
              field={props.field}
              formControl={props.form.control}
            />
          ) : null}
          {props.field.type === "short_text" ? (
            <InputField field={props.field} formField={field} type="text" />
          ) : null}
          {props.field.type === "single_select" ? (
            <SingleSelectField field={props.field} formField={field} />
          ) : null}
        </FormItem>
      )}
    />
  );
}
