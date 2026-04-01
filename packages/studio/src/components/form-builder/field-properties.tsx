import { Plus, Trash2 } from "lucide-react";

import type {
  IDeclarativeFormAddressField,
  IDeclarativeFormCameraField,
  IDeclarativeFormDropdownField,
  IDeclarativeFormEmailField,
  IDeclarativeFormField,
  IDeclarativeFormRatingField,
  IDeclarativeFormSelectField,
  IDeclarativeFormValidator,
} from "@/lib/declarative-form-types";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

import { BuilderPaneHeader } from "./panel-shell";
import { getEditableFieldType, getFieldTypeLabel, getOptionStrings } from "./shared";

type FieldPropertiesProps = {
  field: IDeclarativeFormField | null;
  onChange: (nextField: IDeclarativeFormField) => void;
};

type ObjectValidatorType =
  | "pattern"
  | "min"
  | "max"
  | "min_length"
  | "max_length"
  | "expression";

type ObjectValidator = Exclude<IDeclarativeFormValidator, "required">;
type PatternValidator = Extract<ObjectValidator, { type?: "pattern" }>;
type ExpressionValidator = Extract<ObjectValidator, { type?: "expression" }>;
type MinValidator = Extract<ObjectValidator, { type?: "min" }>;
type MaxValidator = Extract<ObjectValidator, { type?: "max" }>;
type MinLengthValidator = Extract<ObjectValidator, { type?: "min_length" }>;
type MaxLengthValidator = Extract<ObjectValidator, { type?: "max_length" }>;
type ValueValidator =
  | MinValidator
  | MaxValidator
  | MinLengthValidator
  | MaxLengthValidator;

type ValidatorDefinition = {
  type: ObjectValidatorType;
  title: string;
  description: string;
  valueLabel: string;
  valueKind: "text" | "number" | "textarea";
};

const validatorDefinitions: ValidatorDefinition[] = [
  {
    type: "pattern",
    title: "Pattern",
    description: "Validate the value against a regex pattern.",
    valueLabel: "Regex",
    valueKind: "text",
  },
  {
    type: "min",
    title: "Minimum",
    description: "Require a minimum numeric, date, or text-comparable value.",
    valueLabel: "Minimum value",
    valueKind: "text",
  },
  {
    type: "max",
    title: "Maximum",
    description: "Require a maximum numeric, date, or text-comparable value.",
    valueLabel: "Maximum value",
    valueKind: "text",
  },
  {
    type: "min_length",
    title: "Minimum Length",
    description: "Require a minimum number of characters.",
    valueLabel: "Minimum length",
    valueKind: "number",
  },
  {
    type: "max_length",
    title: "Maximum Length",
    description: "Limit the number of characters allowed.",
    valueLabel: "Maximum length",
    valueKind: "number",
  },
  {
    type: "expression",
    title: "Expression",
    description: "Validate the value using a custom expression.",
    valueLabel: "Expression",
    valueKind: "textarea",
  },
];

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isPatternValidator(
  validator: ObjectValidator | undefined,
): validator is PatternValidator {
  return !!validator && validator.type === "pattern";
}

function isExpressionValidator(
  validator: ObjectValidator | undefined,
): validator is ExpressionValidator {
  return !!validator && validator.type === "expression";
}

function isValueValidator(
  validator: ObjectValidator | undefined,
): validator is ValueValidator {
  return (
    !!validator &&
    (validator.type === "min" ||
      validator.type === "max" ||
      validator.type === "min_length" ||
      validator.type === "max_length")
  );
}

function isMinValidator(
  validator: ObjectValidator | undefined,
): validator is MinValidator {
  return !!validator && validator.type === "min";
}

function isMaxValidator(
  validator: ObjectValidator | undefined,
): validator is MaxValidator {
  return !!validator && validator.type === "max";
}

function isEmailField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormEmailField {
  return field.type === "email";
}

function isDropdownField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormDropdownField {
  return field.type === "dropdown";
}

function isSelectField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormSelectField {
  return field.type === "single_select" || field.type === "multiple_select";
}

function isRatingField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormRatingField {
  return field.type === "rating";
}

function isAddressField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormAddressField {
  return (
    field.type === "address" ||
    field.type === "address_country" ||
    field.type === "address_locality" ||
    field.type === "address_region"
  );
}

function isCameraField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormCameraField {
  return field.type === "camera";
}

function getValidators(field: IDeclarativeFormField): IDeclarativeFormValidator[] {
  return [...(field.validators ?? [])];
}

function getObjectValidator(
  field: IDeclarativeFormField,
  type: ObjectValidatorType,
) {
  return (field.validators ?? []).find(
    (validator): validator is ObjectValidator =>
      typeof validator === "object" && validator.type === type,
  );
}

function createObjectValidator(type: ObjectValidatorType): ObjectValidator {
  switch (type) {
    case "pattern":
      return { type: "pattern", regex: "", message: "" };
    case "min":
      return { type: "min", value: "", message: "" };
    case "max":
      return { type: "max", value: "", message: "" };
    case "min_length":
      return { type: "min_length", value: undefined, message: "" };
    case "max_length":
      return { type: "max_length", value: undefined, message: "" };
    case "expression":
      return { type: "expression", expression: "", message: "" };
  }
}

function withUpdatedValidator(
  field: IDeclarativeFormField,
  nextValidator: ObjectValidator,
): IDeclarativeFormField {
  const validators = getValidators(field);
  const index = validators.findIndex(
    (validator) =>
      typeof validator === "object" && validator.type === nextValidator.type,
  );

  if (index >= 0) {
    validators[index] = nextValidator;
  } else {
    validators.push(nextValidator);
  }

  return {
    ...field,
    validators,
  };
}

function withoutValidator(
  field: IDeclarativeFormField,
  type: ObjectValidatorType | "required",
): IDeclarativeFormField {
  return {
    ...field,
    validators: getValidators(field).filter((validator) => {
      if (type === "required") {
        return validator !== "required";
      }

      return !(typeof validator === "object" && validator.type === type);
    }),
  };
}

function withRequiredValidator(field: IDeclarativeFormField): IDeclarativeFormField {
  const validators = getValidators(field);

  if (validators.includes("required")) {
    return field;
  }

  return {
    ...field,
    validators: [...validators, "required" as const],
  };
}

function getValidatorValue(
  validator: ObjectValidator | undefined,
  type: ObjectValidatorType,
) {
  switch (type) {
    case "pattern":
      return isPatternValidator(validator) ? getStringValue(validator.regex) : "";
    case "expression":
      return isExpressionValidator(validator)
        ? getStringValue(validator.expression)
        : "";
    case "min":
    case "max":
    case "min_length":
    case "max_length":
      return isValueValidator(validator) && validator.value !== undefined
        ? String(validator.value)
        : "";
  }
}

function OptionsEditor({
  field,
  optionValues,
  onChange,
}: {
  field: IDeclarativeFormDropdownField | IDeclarativeFormSelectField;
  optionValues: string[];
  onChange: (nextField: IDeclarativeFormField) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({
              ...field,
              options: [...optionValues, `Option ${optionValues.length + 1}`],
            });
          }}
        >
          <Plus />
          Add Option
        </Button>
      </div>

      <div className="space-y-2">
        {optionValues.map((option, index) => (
          <div
            key={`${field.id ?? "field"}-option-${index}`}
            className="flex items-center gap-2"
          >
            <Input
              value={option}
              onChange={(event) => {
                const nextOptions = optionValues.map((value, optionIndex) =>
                  optionIndex === index ? event.target.value : value,
                );

                onChange({
                  ...field,
                  options: nextOptions,
                });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove option"
              onClick={() => {
                const nextOptions = optionValues.filter(
                  (_, optionIndex) => optionIndex !== index,
                );

                onChange({
                  ...field,
                  options: nextOptions,
                });
              }}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidatorEditor({
  field,
  onChange,
}: {
  field: IDeclarativeFormField;
  onChange: (nextField: IDeclarativeFormField) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-background px-3 py-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="field-required"
            checked={(field.validators ?? []).some(
              (validator) => validator === "required",
            )}
            onCheckedChange={(checked) => {
              if (checked === true) {
                onChange(withRequiredValidator(field));
                return;
              }

              onChange(withoutValidator(field, "required"));
            }}
          />

          <div className="space-y-1">
            <Label htmlFor="field-required">Required</Label>
            <p className="text-xs text-muted-foreground">
              Require respondents to fill this field before submitting.
            </p>
          </div>
        </div>
      </div>

      {validatorDefinitions.map((definition) => {
        const validator = getObjectValidator(field, definition.type);
        const isEnabled = !!validator;
        const value = getValidatorValue(validator, definition.type);
        const message = getStringValue(validator?.message);

        return (
          <div
            key={definition.type}
            className="rounded-xl border border-border bg-background px-3 py-3"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={`validator-${definition.type}`}
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    onChange(
                      withUpdatedValidator(
                        field,
                        validator ?? createObjectValidator(definition.type),
                      ),
                    );
                    return;
                  }

                  onChange(withoutValidator(field, definition.type));
                }}
              />

              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`validator-${definition.type}`}>
                  {definition.title}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {definition.description}
                </p>
              </div>
            </div>

            {isEnabled && (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label>{definition.valueLabel}</Label>
                  {definition.valueKind === "textarea" ? (
                    <Textarea
                      value={value}
                      onChange={(event) => {
                        const nextValidator = isExpressionValidator(validator)
                          ? validator
                          : createObjectValidator("expression");

                        onChange(
                          withUpdatedValidator(field, {
                            ...nextValidator,
                            expression: event.target.value,
                          }),
                        );
                      }}
                    />
                  ) : (
                    <Input
                      type={definition.valueKind === "number" ? "number" : "text"}
                      value={value}
                      onChange={(event) => {
                        if (definition.type === "min_length") {
                          const nextValidator =
                            validator?.type === "min_length"
                              ? validator
                              : createObjectValidator("min_length");

                          onChange(
                            withUpdatedValidator(field, {
                              ...nextValidator,
                              value:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            }),
                          );
                          return;
                        }

                        if (definition.type === "max_length") {
                          const nextValidator =
                            validator?.type === "max_length"
                              ? validator
                              : createObjectValidator("max_length");

                          onChange(
                            withUpdatedValidator(field, {
                              ...nextValidator,
                              value:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            }),
                          );
                          return;
                        }

                        if (definition.type === "pattern") {
                          const nextValidator = isPatternValidator(validator)
                            ? validator
                            : createObjectValidator("pattern");

                          onChange(
                            withUpdatedValidator(field, {
                              ...nextValidator,
                              regex: event.target.value,
                            }),
                          );
                          return;
                        }

                        if (definition.type === "min") {
                          const nextValidator: MinValidator =
                            isMinValidator(validator)
                              ? validator
                              : { type: "min", value: "", message: "" };

                          onChange(
                            withUpdatedValidator(field, {
                              ...nextValidator,
                              value: event.target.value,
                            }),
                          );
                          return;
                        }

                        const nextValidator: MaxValidator =
                          isMaxValidator(validator)
                            ? validator
                            : { type: "max", value: "", message: "" };

                        onChange(
                          withUpdatedValidator(field, {
                            ...nextValidator,
                            value: event.target.value,
                          }),
                        );
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Validation Message</Label>
                  <Input
                    value={message}
                    onChange={(event) => {
                      onChange(
                        withUpdatedValidator(field, {
                          ...(validator ?? createObjectValidator(definition.type)),
                          message: event.target.value,
                        }),
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FieldProperties({
  field,
  onChange,
}: FieldPropertiesProps) {
  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-xl border border-dashed border-border bg-muted/10 px-8 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a field to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const currentType = getEditableFieldType(field);
  const emailField = isEmailField(field) ? field : null;
  const dropdownField = isDropdownField(field) ? field : null;
  const selectField = isSelectField(field) ? field : null;
  const ratingField = isRatingField(field) ? field : null;
  const addressField = isAddressField(field) ? field : null;
  const cameraField = isCameraField(field) ? field : null;
  const optionValues = dropdownField
    ? getOptionStrings(dropdownField.options)
    : selectField
      ? getOptionStrings(selectField.options)
      : [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <BuilderPaneHeader title="Field Properties" />

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
        <div className="space-y-2">
          <Label htmlFor="field-id">Field ID</Label>
          <Input
            id="field-id"
            value={getStringValue(field.id)}
            onChange={(event) => {
              onChange({
                ...field,
                id: event.target.value,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-type">Field Type</Label>
          <Input id="field-type" value={getFieldTypeLabel(currentType)} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={getStringValue(field.label)}
            onChange={(event) => {
              onChange({
                ...field,
                label: event.target.value,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={getStringValue(field.placeholder)}
            onChange={(event) => {
              onChange({
                ...field,
                placeholder: event.target.value,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-visible-when">Visible When</Label>
          <Textarea
            id="field-visible-when"
            value={getStringValue(field.visible_when)}
            onChange={(event) => {
              onChange({
                ...field,
                visible_when: event.target.value,
              });
            }}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Validation</h3>
          <ValidatorEditor field={field} onChange={onChange} />
        </div>

        {emailField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email Settings
            </h3>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3">
              <Checkbox
                id="field-otp"
                checked={emailField.otp === true}
                onCheckedChange={(checked) => {
                  onChange({
                    ...emailField,
                    otp: checked === true,
                  });
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="field-otp">Require OTP</Label>
                <p className="text-xs text-muted-foreground">
                  Ask users to verify the email with a one-time passcode.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3">
              <Checkbox
                id="field-block-free-email"
                checked={emailField.block_free_email === true}
                onCheckedChange={(checked) => {
                  onChange({
                    ...emailField,
                    block_free_email: checked === true,
                  });
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="field-block-free-email">
                  Block free email domains
                </Label>
                <p className="text-xs text-muted-foreground">
                  Restrict addresses from common free email providers.
                </p>
              </div>
            </div>
          </div>
        )}

        {dropdownField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dropdown Settings
            </h3>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3">
              <Checkbox
                id="field-searchable"
                checked={dropdownField.searchable === true}
                onCheckedChange={(checked) => {
                  onChange({
                    ...dropdownField,
                    searchable: checked === true,
                  });
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="field-searchable">Searchable</Label>
                <p className="text-xs text-muted-foreground">
                  Allow users to search within the dropdown options.
                </p>
              </div>
            </div>

            <OptionsEditor
              field={dropdownField}
              optionValues={optionValues}
              onChange={onChange}
            />
          </div>
        )}

        {selectField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selection Settings
            </h3>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3">
              <Checkbox
                id="field-allow-other"
                checked={selectField.allow_other === true}
                onCheckedChange={(checked) => {
                  onChange({
                    ...selectField,
                    allow_other: checked === true,
                  });
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="field-allow-other">Allow “Other” option</Label>
                <p className="text-xs text-muted-foreground">
                  Let respondents provide their own value when none fit.
                </p>
              </div>
            </div>

            <OptionsEditor
              field={selectField}
              optionValues={optionValues}
              onChange={onChange}
            />
          </div>
        )}

        {ratingField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rating Settings
            </h3>

            <div className="space-y-2">
              <Label htmlFor="field-min-label">Minimum Label</Label>
              <Input
                id="field-min-label"
                value={getStringValue(ratingField.min_label)}
                onChange={(event) => {
                  onChange({
                    ...ratingField,
                    min_label: event.target.value,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-max-label">Maximum Label</Label>
              <Input
                id="field-max-label"
                value={getStringValue(ratingField.max_label)}
                onChange={(event) => {
                  onChange({
                    ...ratingField,
                    max_label: event.target.value,
                  });
                }}
              />
            </div>
          </div>
        )}

        {addressField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Address Settings
            </h3>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={addressField.outputFormat ?? "string"}
                onValueChange={(value) => {
                  onChange({
                    ...addressField,
                    outputFormat: value as "string" | "structured",
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {cameraField && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Camera Settings
            </h3>

            <div className="space-y-2">
              <Label>Facing Mode</Label>
              <Select
                value={cameraField.facing_mode ?? "rear"}
                onValueChange={(value) => {
                  onChange({
                    ...cameraField,
                    facing_mode: value as "front" | "rear",
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Front</SelectItem>
                  <SelectItem value="rear">Rear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
