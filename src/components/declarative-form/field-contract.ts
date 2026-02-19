import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";

import type { IResolvedDeclarativeFormField } from "./localized-content";

type FieldValidator = NonNullable<IResolvedDeclarativeFormField["validators"]>[number];
type FieldValidatorObject = Extract<FieldValidator, { type: string }>;

export type FieldMinValidator = Extract<FieldValidatorObject, { type: "min" }>;
export type FieldMaxValidator = Extract<FieldValidatorObject, { type: "max" }>;

export type DeclarativeFieldMeta = {
  hasPatternValidator: boolean;
  isRequired: boolean;
  maxValidator?: FieldMaxValidator;
  minValidator?: FieldMinValidator;
};

export type DeclarativeFieldComponentProps = {
  controllerField: ControllerRenderProps<FieldValues, string>;
  field: IResolvedDeclarativeFormField;
  form: UseFormReturn<FieldValues, FieldValues, FieldValues>;
  meta: DeclarativeFieldMeta;
};

export function getFieldMeta(
  field: IResolvedDeclarativeFormField
): DeclarativeFieldMeta {
  return {
    hasPatternValidator: !!field.validators?.some(
      (validator) => typeof validator === "object" && validator.type === "pattern"
    ),
    isRequired: !!field.validators?.some((validator) => validator === "required"),
    maxValidator: field.validators?.find(
      (validator) => typeof validator === "object" && validator.type === "max"
    ) as FieldMaxValidator | undefined,
    minValidator: field.validators?.find(
      (validator) => typeof validator === "object" && validator.type === "min"
    ) as FieldMinValidator | undefined,
  };
}
