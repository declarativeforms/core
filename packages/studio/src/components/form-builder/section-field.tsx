import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Checkbox,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components";
import type {
  IDeclarativeFormAddressField,
  IDeclarativeFormCameraField,
  IDeclarativeFormDropdownField,
  IDeclarativeFormEmailField,
  IDeclarativeFormField,
  IDeclarativeFormOption,
  IDeclarativeFormRatingField,
  IDeclarativeFormSelectField,
  IDeclarativeFormValidator,
} from "@declarativeforms/types";

type ObjectValidatorType =
  | "pattern"
  | "min"
  | "max"
  | "min_length"
  | "max_length"
  | "expression";

type RequiredValidatorObject = Extract<
  IDeclarativeFormValidator,
  { type: "required" }
>;
type RequiredValidator = "required" | RequiredValidatorObject;
type ObjectValidator = Extract<
  IDeclarativeFormValidator,
  { type?: ObjectValidatorType }
>;

const objectValidatorDefinitions = [
  {
    type: "pattern",
    title: "Pattern",
    valueLabel: "Regex",
    valueType: "text",
  },
  {
    type: "min",
    title: "Minimum",
    valueLabel: "Value",
    valueType: "text",
  },
  {
    type: "max",
    title: "Maximum",
    valueLabel: "Value",
    valueType: "text",
  },
  {
    type: "min_length",
    title: "Minimum Length",
    valueLabel: "Length",
    valueType: "number",
  },
  {
    type: "max_length",
    title: "Maximum Length",
    valueLabel: "Length",
    valueType: "number",
  },
  {
    type: "expression",
    title: "Expression",
    valueLabel: "Expression",
    valueType: "textarea",
  },
] as const satisfies ReadonlyArray<{
  title: string;
  type: ObjectValidatorType;
  valueLabel: string;
  valueType: "text" | "number" | "textarea";
}>;

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

function isChoiceField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormDropdownField | IDeclarativeFormSelectField {
  return isDropdownField(field) || isSelectField(field);
}

function isEmailField(
  field: IDeclarativeFormField,
): field is IDeclarativeFormEmailField {
  return field.type === "email";
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

function getValidators(field: IDeclarativeFormField) {
  return [...(field.validators ?? [])];
}

function isRequiredValidator(
  validator: IDeclarativeFormValidator,
): validator is RequiredValidator {
  return (
    validator === "required" ||
    (typeof validator === "object" && validator.type === "required")
  );
}

function getRequiredValidator(field: IDeclarativeFormField) {
  return getValidators(field).find(isRequiredValidator);
}

function hasRequiredValidator(field: IDeclarativeFormField) {
  return !!getRequiredValidator(field);
}

function withRequiredValidator(field: IDeclarativeFormField) {
  if (hasRequiredValidator(field)) {
    return field;
  }

  return {
    ...field,
    validators: [...getValidators(field), "required" as const],
  };
}

function withRequiredValidatorMessage(
  field: IDeclarativeFormField,
  message: string,
) {
  const validators = getValidators(field);
  const index = validators.findIndex(isRequiredValidator);
  const nextValidator: RequiredValidator =
    message.trim() === "" ? "required" : { type: "required", message };

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
) {
  return {
    ...field,
    validators: getValidators(field).filter((validator) => {
      if (type === "required") {
        return !isRequiredValidator(validator);
      }

      return !(typeof validator === "object" && validator.type === type);
    }),
  };
}

function getObjectValidator(
  field: IDeclarativeFormField,
  type: ObjectValidatorType,
) {
  return getValidators(field).find(
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
) {
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

function getValidatorValue(
  validator: ObjectValidator | undefined,
  type: ObjectValidatorType,
) {
  if (!validator) {
    return "";
  }

  switch (type) {
    case "pattern":
      return validator.type === "pattern" ? (validator.regex ?? "") : "";
    case "expression":
      return validator.type === "expression"
        ? (validator.expression ?? "")
        : "";
    case "min":
    case "max":
    case "min_length":
    case "max_length":
      return "value" in validator && validator.value !== undefined
        ? String(validator.value)
        : "";
  }
}

function getValidatorMessage(validator: ObjectValidator | undefined) {
  return validator?.message && typeof validator.message === "string"
    ? validator.message
    : "";
}

function getRequiredValidatorMessage(field: IDeclarativeFormField) {
  const validator = getRequiredValidator(field);
  return validator &&
    typeof validator === "object" &&
    typeof validator.message === "string"
    ? validator.message
    : "";
}

function getOptionString(option: IDeclarativeFormOption) {
  if (typeof option === "string") {
    return option;
  }

  if (typeof option.label === "string" && option.label.trim()) {
    return option.label;
  }

  return option.value ?? "";
}

export function SectionField({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  field: IDeclarativeFormField;
  onChange: (field: IDeclarativeFormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const choiceOptions = isChoiceField(field)
    ? (field.options ?? []).map(getOptionString)
    : [];

  return (
    <Item
      variant="outline"
      className={isExpanded ? "border-foreground/15 bg-muted/5" : ""}
    >
      <ItemHeader>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none transition-colors hover:bg-accent/30 focus-visible:bg-accent/30"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
        >
          <ItemContent>
            <ItemTitle>{field.label as any}</ItemTitle>
            <ItemDescription>{field.type as any}</ItemDescription>
          </ItemContent>
        </button>

        <ItemActions>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move field up"
          >
            <ChevronUp />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move field down"
          >
            <ChevronDown />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete field"
          >
            <Trash2 />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded((current) => !current)}
            aria-label={isExpanded ? "Collapse field" : "Expand field"}
          >
            <ChevronDown
              className={
                isExpanded
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </ItemActions>
      </ItemHeader>

      {isExpanded ? (
        <div className="basis-full border-t border-border pt-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Field ID</FieldLabel>
              <Input
                value={field.id ?? ""}
                onChange={(event) =>
                  onChange({
                    ...field,
                    id: event.target.value || undefined,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Field Type</FieldLabel>
              <Input value={field.type} disabled />
            </Field>

            <Field>
              <FieldLabel>Label</FieldLabel>
              <Input
                value={field.label as any}
                onChange={(event) =>
                  onChange({
                    ...field,
                    label: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Placeholder</FieldLabel>
              <Input
                value={field.placeholder as any}
                onChange={(event) =>
                  onChange({
                    ...field,
                    placeholder: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Visible When</FieldLabel>
              <Textarea
                value={field.visible_when ?? ""}
                onChange={(event) =>
                  onChange({
                    ...field,
                    visible_when: event.target.value || undefined,
                  })
                }
              />
            </Field>

            {isChoiceField(field) ? (
              <Field>
                <FieldLabel>Options</FieldLabel>
                <div className="space-y-3">
                  {choiceOptions.map((option: string, index: number) => (
                    <div
                      key={`${field.id ?? "field"}-option-${index}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={option}
                        onChange={(event) =>
                          onChange({
                            ...field,
                            options: choiceOptions.map(
                              (currentOption: string, optionIndex: number) =>
                                optionIndex === index
                                  ? event.target.value
                                  : currentOption,
                            ),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          onChange({
                            ...field,
                            options: choiceOptions.filter(
                              (_: string, optionIndex: number) =>
                                optionIndex !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      onChange({
                        ...field,
                        options: [
                          ...choiceOptions,
                          `Option ${choiceOptions.length + 1}`,
                        ],
                      })
                    }
                  >
                    <Plus />
                    Add Option
                  </Button>
                </div>
              </Field>
            ) : null}

            <Field>
              <div className="space-y-3">
                <Item variant="outline" className="bg-muted/10">
                  <div className="flex basis-full flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={hasRequiredValidator(field)}
                        onCheckedChange={(checked) =>
                          onChange(
                            checked === true
                              ? withRequiredValidator(field)
                              : withoutValidator(field, "required"),
                          )
                        }
                      />
                      <p className="text-sm font-medium text-foreground">
                        Required
                      </p>
                    </div>

                    {hasRequiredValidator(field) ? (
                      <Field>
                        <FieldLabel>Message</FieldLabel>
                        <Input
                          value={getRequiredValidatorMessage(field)}
                          onChange={(event) =>
                            onChange(
                              withRequiredValidatorMessage(
                                field,
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </Field>
                    ) : null}
                  </div>
                </Item>

                {objectValidatorDefinitions.map((definition) => {
                  const validator = getObjectValidator(field, definition.type);
                  const isEnabled = !!validator;

                  return (
                    <Item
                      key={definition.type}
                      variant="outline"
                      className="bg-muted/10"
                    >
                      <div className="flex basis-full flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isEnabled}
                            onCheckedChange={(checked) =>
                              onChange(
                                checked === true
                                  ? withUpdatedValidator(
                                      field,
                                      validator ??
                                        createObjectValidator(definition.type),
                                    )
                                  : withoutValidator(field, definition.type),
                              )
                            }
                          />
                          <p className="text-sm font-medium text-foreground">
                            {definition.title}
                          </p>
                        </div>

                        {isEnabled ? (
                          <FieldGroup>
                            <Field>
                              <FieldLabel>{definition.valueLabel}</FieldLabel>
                              {definition.valueType === "textarea" ? (
                                <Textarea
                                  value={getValidatorValue(
                                    validator,
                                    definition.type,
                                  )}
                                  onChange={(event) => {
                                    const nextValidator =
                                      validator ??
                                      createObjectValidator(definition.type);

                                    if (definition.type === "expression") {
                                      onChange(
                                        withUpdatedValidator(field, {
                                          ...nextValidator,
                                          expression: event.target.value,
                                        }),
                                      );
                                      return;
                                    }
                                  }}
                                />
                              ) : (
                                <Input
                                  type={
                                    definition.valueType === "number"
                                      ? "number"
                                      : "text"
                                  }
                                  value={getValidatorValue(
                                    validator,
                                    definition.type,
                                  )}
                                  onChange={(event) => {
                                    const nextValidator =
                                      validator ??
                                      createObjectValidator(definition.type);
                                    if (
                                      definition.type === "pattern" &&
                                      nextValidator.type === "pattern"
                                    ) {
                                      onChange(
                                        withUpdatedValidator(field, {
                                          ...nextValidator,
                                          regex: event.target.value,
                                        }),
                                      );
                                      return;
                                    }

                                    if ("value" in nextValidator) {
                                      if (
                                        (definition.type === "min_length" ||
                                          definition.type === "max_length") &&
                                        (nextValidator.type === "min_length" ||
                                          nextValidator.type === "max_length")
                                      ) {
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

                                      if (
                                        nextValidator.type === "min" ||
                                        nextValidator.type === "max"
                                      ) {
                                        onChange(
                                          withUpdatedValidator(field, {
                                            ...nextValidator,
                                            value: event.target.value,
                                          }),
                                        );
                                      }
                                    }
                                  }}
                                />
                              )}
                            </Field>

                            <Field>
                              <FieldLabel>Message</FieldLabel>
                              <Input
                                value={getValidatorMessage(validator)}
                                onChange={(event) => {
                                  const nextValidator =
                                    validator ??
                                    createObjectValidator(definition.type);

                                  onChange(
                                    withUpdatedValidator(field, {
                                      ...nextValidator,
                                      message: event.target.value,
                                    }),
                                  );
                                }}
                              />
                            </Field>
                          </FieldGroup>
                        ) : null}
                      </div>
                    </Item>
                  );
                })}
              </div>
            </Field>

            {isEmailField(field) ||
            isRatingField(field) ||
            isAddressField(field) ||
            isCameraField(field) ||
            isDropdownField(field) ||
            isSelectField(field) ? (
              <Field>
                <FieldLabel>Field Settings</FieldLabel>
                <div className="space-y-3">
                  {isEmailField(field) ? (
                    <>
                      <Item variant="outline" className="bg-muted/10">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={field.otp === true}
                            onCheckedChange={(checked) =>
                              onChange({
                                ...field,
                                otp: checked === true,
                              })
                            }
                          />
                          <p className="text-sm font-medium text-foreground">
                            Enable OTP
                          </p>
                        </div>
                      </Item>

                      <Item variant="outline" className="bg-muted/10">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={field.block_free_email === true}
                            onCheckedChange={(checked) =>
                              onChange({
                                ...field,
                                block_free_email: checked === true,
                              })
                            }
                          />
                          <p className="text-sm font-medium text-foreground">
                            Block free email providers
                          </p>
                        </div>
                      </Item>
                    </>
                  ) : null}

                  {isRatingField(field) ? (
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Min Label</FieldLabel>
                        <Input
                          value={field.min_label as any}
                          onChange={(event) =>
                            onChange({
                              ...field,
                              min_label: event.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Max Label</FieldLabel>
                        <Input
                          value={field.max_label as any}
                          onChange={(event) =>
                            onChange({
                              ...field,
                              max_label: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </FieldGroup>
                  ) : null}

                  {isAddressField(field) ? (
                    <Field>
                      <FieldLabel>Output Format</FieldLabel>
                      <Select
                        value={field.outputFormat ?? "string"}
                        onValueChange={(value) =>
                          onChange({
                            ...field,
                            outputFormat: value as "string" | "structured",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">string</SelectItem>
                          <SelectItem value="structured">structured</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}

                  {isCameraField(field) ? (
                    <Field>
                      <FieldLabel>Facing Mode</FieldLabel>
                      <Select
                        value={field.facing_mode ?? "rear"}
                        onValueChange={(value) =>
                          onChange({
                            ...field,
                            facing_mode: value as "front" | "rear",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="front">front</SelectItem>
                          <SelectItem value="rear">rear</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}

                  {isDropdownField(field) ? (
                    <Item variant="outline" className="bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={field.searchable === true}
                          onCheckedChange={(checked) =>
                            onChange({
                              ...field,
                              searchable: checked === true,
                            })
                          }
                        />
                        <p className="text-sm font-medium text-foreground">
                          Searchable
                        </p>
                      </div>
                    </Item>
                  ) : null}

                  {isSelectField(field) ? (
                    <Item variant="outline" className="bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={field.allow_other === true}
                          onCheckedChange={(checked) =>
                            onChange({
                              ...field,
                              allow_other: checked === true,
                            })
                          }
                        />
                        <p className="text-sm font-medium text-foreground">
                          Allow &quot;Other&quot; option
                        </p>
                      </div>
                    </Item>
                  ) : null}
                </div>
              </Field>
            ) : null}
          </FieldGroup>
        </div>
      ) : null}
    </Item>
  );
}
