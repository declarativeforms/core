import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  SectionField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import type {
  DeclarativeFieldType,
  IDeclarativeFormField,
  IDeclarativeFormSection,
} from "@declarativeforms/types";

type NextMode =
  | "next_in_order"
  | "section"
  | "conditional"
  | "external"
  | "done";

type ConditionalRule = {
  when: string;
  go: string;
};

const BUILDER_FIELD_TYPES = [
  "address",
  "address_country",
  "address_locality",
  "address_region",
  "camera",
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "date_month",
  "dropdown",
  "geolocation",
  "hidden",
  "single_select",
  "multiple_select",
  "rating",
  "file_upload",
  "signature",
  "time",
  "turnstile",
  "url",
  "mobile_number",
] as const satisfies readonly DeclarativeFieldType[];

type SupportedFieldType = (typeof BUILDER_FIELD_TYPES)[number];

function parseNextMode(section: IDeclarativeFormSection): NextMode {
  const next = section.next;

  if (next === undefined || next === null) {
    return "next_in_order";
  }

  if (typeof next === "string") {
    if (next === "done") {
      return "done";
    }

    if (next.startsWith("https://")) {
      return "external";
    }

    return "section";
  }

  if (Array.isArray(next) && next.length > 0) {
    return "conditional";
  }

  return "next_in_order";
}

function parseNextSectionId(section: IDeclarativeFormSection): string {
  if (typeof section.next !== "string") {
    return "";
  }

  return section.next;
}

function parseExternalUrl(section: IDeclarativeFormSection): string {
  if (typeof section.next !== "string") {
    return "";
  }

  return section.next.startsWith("https://") ? section.next : "";
}

function parseConditionalRules(section: IDeclarativeFormSection) {
  if (!Array.isArray(section.next)) {
    return [];
  }

  return section.next
    .filter(
      (rule): rule is { when?: string; go?: string } =>
        "when" in rule || "go" in rule,
    )
    .map((rule) => ({
      go: rule.go ?? "",
      when: rule.when ?? "",
    }));
}

function parseElseFallback(section: IDeclarativeFormSection): string {
  if (!Array.isArray(section.next)) {
    return "done";
  }

  const elseRule = section.next.find(
    (rule): rule is { else?: string } => "else" in rule,
  );

  return elseRule?.else ?? "done";
}

function createFieldId(
  fields: NonNullable<IDeclarativeFormSection["fields"]>,
  type: SupportedFieldType,
) {
  const existingIds = new Set(fields.map((field) => field.id).filter(Boolean));
  let index = fields.length + 1;

  while (existingIds.has(`${type}_${index}`)) {
    index += 1;
  }

  return `${type}_${index}`;
}

function createDefaultField(type: SupportedFieldType, id: string) {
  const baseField = {
    id,
    type,
    label: "Untitled Field",
    placeholder: "",
    validators: [],
  };

  switch (type) {
    case "dropdown":
      return {
        ...baseField,
        options: ["Option 1", "Option 2"],
      } as IDeclarativeFormField;

    case "single_select":
    case "multiple_select":
      return {
        ...baseField,
        options: ["Option 1", "Option 2"],
      } as IDeclarativeFormField;

    default:
      return baseField as IDeclarativeFormField;
  }
}

export function Section({
  section,
  index,
  sections,
  onChange,
}: {
  section: IDeclarativeFormSection;
  index: number;
  sections: IDeclarativeFormSection[];
  onChange: (nextSection: IDeclarativeFormSection) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newFieldType, setNewFieldType] =
    useState<SupportedFieldType>("short_text");
  const currentMode = parseNextMode(section);
  const otherSections = sections.filter(
    (sectionItem, sectionIndex) =>
      sectionIndex !== index && Boolean(sectionItem.id),
  );
  const conditionalRules = parseConditionalRules(section);
  const elseFallback = parseElseFallback(section);
  const nextSectionId = parseNextSectionId(section);

  const handleModeChange = (mode: NextMode) => {
    switch (mode) {
      case "next_in_order":
        onChange({ ...section, next: undefined });
        break;
      case "done":
        onChange({ ...section, next: "done" });
        break;
      case "section":
        onChange({ ...section, next: otherSections[0]?.id ?? "done" });
        break;
      case "external":
        onChange({ ...section, next: "https://" });
        break;
      case "conditional":
        onChange({
          ...section,
          next: [
            { when: "", go: otherSections[0]?.id ?? "done" },
            { else: "done" },
          ],
        });
        break;
    }
  };

  const handleSectionIdChange = (sectionId: string) => {
    onChange({ ...section, next: sectionId });
  };

  const handleExternalUrlChange = (url: string) => {
    onChange({ ...section, next: url });
  };

  const handleUpdateConditionalRule = (
    ruleIndex: number,
    field: keyof ConditionalRule,
    value: string,
  ) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter(
      (rule): rule is { when?: string; go?: string } =>
        "when" in rule || "go" in rule,
    );
    const elseRule = section.next.find(
      (rule): rule is { else?: string } => "else" in rule,
    ) ?? { else: "done" };

    if (ruleIndex < whenGoRules.length) {
      whenGoRules[ruleIndex] = {
        ...whenGoRules[ruleIndex],
        [field]: value,
      };
    }

    onChange({
      ...section,
      next: [...whenGoRules, elseRule],
    });
  };

  const handleAddConditionalRule = () => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter(
      (rule): rule is { when?: string; go?: string } =>
        "when" in rule || "go" in rule,
    );
    const elseRule = section.next.find(
      (rule): rule is { else?: string } => "else" in rule,
    ) ?? { else: "done" };

    onChange({
      ...section,
      next: [
        ...whenGoRules,
        { when: "", go: otherSections[0]?.id ?? "done" },
        elseRule,
      ],
    });
  };

  const handleRemoveConditionalRule = (ruleIndex: number) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter(
      (rule): rule is { when?: string; go?: string } =>
        "when" in rule || "go" in rule,
    );
    const elseRule = section.next.find(
      (rule): rule is { else?: string } => "else" in rule,
    ) ?? { else: "done" };
    const updatedWhenGo = whenGoRules.filter((_, index) => index !== ruleIndex);

    if (updatedWhenGo.length === 0) {
      onChange({ ...section, next: undefined });
      return;
    }

    onChange({
      ...section,
      next: [...updatedWhenGo, elseRule],
    });
  };

  const handleElseFallbackChange = (value: string) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter(
      (rule): rule is { when?: string; go?: string } =>
        "when" in rule || "go" in rule,
    );

    onChange({
      ...section,
      next: [...whenGoRules, { else: value }],
    });
  };

  const handleAddField = () => {
    const fields = section.fields ?? [];
    const nextField = createDefaultField(
      newFieldType,
      createFieldId(fields, newFieldType),
    );

    onChange({
      ...section,
      fields: [...fields, nextField],
    });
  };

  return (
    <Item
      variant="outline"
      className={isExpanded ? "border-foreground/15 bg-muted/5" : ""}
    >
      <ItemHeader>
        <ItemContent>
          <ItemTitle>{section.title as any}</ItemTitle>
          <ItemDescription>
            {section.id || `section_${index + 1}`} •{" "}
            {section.fields?.length ?? 0}{" "}
            {(section.fields?.length ?? 0) === 1 ? "field" : "fields"}
          </ItemDescription>
        </ItemContent>

        <ItemActions>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded((current) => !current)}
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
              <FieldLabel>Title</FieldLabel>
              <Input
                value={typeof section.title === "string" ? section.title : ""}
                onChange={(event) =>
                  onChange({
                    ...section,
                    title: event.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Section ID</FieldLabel>
              <Input
                value={section.id ?? ""}
                onChange={(event) =>
                  onChange({
                    ...section,
                    id: event.target.value || undefined,
                  })
                }
              />
            </Field>

            <Field>
              <FieldLabel>After this section</FieldLabel>
              <Select value={currentMode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next_in_order">
                    Continue to next section
                  </SelectItem>
                  <SelectItem value="section">
                    Go to specific section
                  </SelectItem>
                  <SelectItem value="conditional">Conditional logic</SelectItem>
                  <SelectItem value="external">Redirect to URL</SelectItem>
                  <SelectItem value="done">Complete form</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {currentMode === "section" ? (
              <Field>
                <FieldLabel>Target section</FieldLabel>
                {otherSections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add more sections to enable navigation.
                  </p>
                ) : (
                  <Select
                    value={
                      nextSectionId && nextSectionId !== "done"
                        ? nextSectionId
                        : "done"
                    }
                    onValueChange={handleSectionIdChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {otherSections.map((sectionItem, sectionIndex) => (
                        <SelectItem
                          key={
                            sectionItem.id ?? `section-option-${sectionIndex}`
                          }
                          value={sectionItem.id ?? ""}
                        >
                          {typeof sectionItem.title === "string"
                            ? sectionItem.title
                            : sectionItem.id}
                        </SelectItem>
                      ))}
                      {nextSectionId &&
                      nextSectionId !== "done" &&
                      !otherSections.some(
                        (sectionItem) => sectionItem.id === nextSectionId,
                      ) ? (
                        <SelectItem value={nextSectionId}>
                          {nextSectionId}
                        </SelectItem>
                      ) : null}
                      <SelectItem value="done">Complete form</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </Field>
            ) : null}

            {currentMode === "external" ? (
              <Field>
                <FieldLabel>Redirect URL</FieldLabel>
                <Input
                  value={parseExternalUrl(section)}
                  placeholder="https://example.com"
                  onChange={(event) =>
                    handleExternalUrlChange(event.target.value)
                  }
                />
              </Field>
            ) : null}

            {currentMode === "conditional" ? (
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Conditional logic</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddConditionalRule}
                  >
                    <Plus />
                    Add Rule
                  </Button>
                </div>
                <div className="space-y-3">
                  {conditionalRules.map((rule, ruleIndex) => (
                    <Item
                      key={`conditional-rule-${ruleIndex}`}
                      variant="outline"
                      className="bg-muted/10"
                    >
                      <div className="flex basis-full flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            Rule {ruleIndex + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              handleRemoveConditionalRule(ruleIndex)
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        <FieldGroup>
                          <Field>
                            <FieldLabel>When (expression)</FieldLabel>
                            <Input
                              value={rule.when}
                              placeholder="{{data.field_id}} === 'yes'"
                              className="font-mono text-xs"
                              onChange={(event) =>
                                handleUpdateConditionalRule(
                                  ruleIndex,
                                  "when",
                                  event.target.value,
                                )
                              }
                            />
                          </Field>

                          <Field>
                            <FieldLabel>Go to</FieldLabel>
                            <Select
                              value={rule.go || "done"}
                              onValueChange={(value) =>
                                handleUpdateConditionalRule(
                                  ruleIndex,
                                  "go",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {otherSections.map(
                                  (sectionItem, sectionIndex) => (
                                    <SelectItem
                                      key={
                                        sectionItem.id ??
                                        `conditional-option-${sectionIndex}`
                                      }
                                      value={sectionItem.id ?? ""}
                                    >
                                      {typeof sectionItem.title === "string"
                                        ? sectionItem.title
                                        : sectionItem.id}
                                    </SelectItem>
                                  ),
                                )}
                                {rule.go &&
                                rule.go !== "done" &&
                                !otherSections.some(
                                  (sectionItem) => sectionItem.id === rule.go,
                                ) ? (
                                  <SelectItem value={rule.go}>
                                    {rule.go}
                                  </SelectItem>
                                ) : null}
                                <SelectItem value="done">
                                  Complete form
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </FieldGroup>
                      </div>
                    </Item>
                  ))}

                  <Field>
                    <FieldLabel>Else</FieldLabel>
                    <Select
                      value={elseFallback}
                      onValueChange={handleElseFallbackChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {otherSections.map((sectionItem, sectionIndex) => (
                          <SelectItem
                            key={
                              sectionItem.id ?? `else-option-${sectionIndex}`
                            }
                            value={sectionItem.id ?? ""}
                          >
                            {typeof sectionItem.title === "string"
                              ? sectionItem.title
                              : sectionItem.id}
                          </SelectItem>
                        ))}
                        {elseFallback !== "done" &&
                        !otherSections.some(
                          (sectionItem) => sectionItem.id === elseFallback,
                        ) ? (
                          <SelectItem value={elseFallback}>
                            {elseFallback}
                          </SelectItem>
                        ) : null}
                        <SelectItem value="done">Complete form</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Fields</FieldLabel>
              <div className="flex items-center gap-2">
                <Select
                  value={newFieldType}
                  onValueChange={(value) =>
                    setNewFieldType(value as SupportedFieldType)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDER_FIELD_TYPES.map((fieldType) => (
                      <SelectItem key={fieldType} value={fieldType}>
                        {fieldType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddField}
                >
                  <Plus />
                  Add Field
                </Button>
              </div>
              <ItemGroup className="gap-3">
                {(section.fields ?? []).length > 0 ? (
                  (section.fields ?? []).map((field, fieldIndex) => (
                    <SectionField
                      key={`field-${fieldIndex}`}
                      field={field}
                      canMoveUp={fieldIndex > 0}
                      canMoveDown={
                        fieldIndex < (section.fields ?? []).length - 1
                      }
                      onChange={(x) =>
                        onChange({
                          ...section,
                          fields: (section.fields ?? []).map(
                            (fieldItem, currentFieldIndex) =>
                              currentFieldIndex === fieldIndex ? x : fieldItem,
                          ),
                        })
                      }
                      onDelete={() =>
                        onChange({
                          ...section,
                          fields: (section.fields ?? []).filter(
                            (_, currentFieldIndex) =>
                              currentFieldIndex !== fieldIndex,
                          ),
                        })
                      }
                      onMoveUp={() => {
                        const nextFields = [...(section.fields ?? [])];
                        const previousField = nextFields[fieldIndex - 1];

                        nextFields[fieldIndex - 1] = nextFields[fieldIndex];
                        nextFields[fieldIndex] = previousField;

                        onChange({
                          ...section,
                          fields: nextFields,
                        });
                      }}
                      onMoveDown={() => {
                        const nextFields = [...(section.fields ?? [])];
                        const nextField = nextFields[fieldIndex + 1];

                        nextFields[fieldIndex + 1] = nextFields[fieldIndex];
                        nextFields[fieldIndex] = nextField;

                        onChange({
                          ...section,
                          fields: nextFields,
                        });
                      }}
                    />
                  ))
                ) : (
                  <Item variant="outline" className="bg-muted/10">
                    <ItemContent>
                      <ItemTitle>No fields yet</ItemTitle>
                      <ItemDescription>
                        This section does not have any fields yet.
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )}
              </ItemGroup>
            </Field>
          </FieldGroup>
        </div>
      ) : null}
    </Item>
  );
}
