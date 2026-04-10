import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
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
  ILocalizedText,
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

const FIELD_TYPE_DETAILS: Record<
  SupportedFieldType,
  { title: string; description: string }
> = {
  address: {
    title: "Address",
    description: "Collect a full address in one field.",
  },
  address_country: {
    title: "Country",
    description: "Capture a country only.",
  },
  address_locality: {
    title: "City or locality",
    description: "Capture a city, town, or locality.",
  },
  address_region: {
    title: "Region or state",
    description: "Capture a region, province, or state.",
  },
  camera: {
    title: "Camera",
    description: "Ask respondents to take a photo.",
  },
  short_text: {
    title: "Short text",
    description: "Single-line input for concise answers.",
  },
  long_text: {
    title: "Long text",
    description: "Multi-line input for longer responses.",
  },
  email: {
    title: "Email",
    description: "Collect an email address with validation.",
  },
  number: {
    title: "Number",
    description: "Accept numeric values only.",
  },
  date: {
    title: "Date",
    description: "Ask for a calendar date.",
  },
  date_month: {
    title: "Month",
    description: "Collect a month and year.",
  },
  dropdown: {
    title: "Dropdown",
    description: "Compact single-choice selection.",
  },
  geolocation: {
    title: "Geolocation",
    description: "Capture the respondent's location.",
  },
  hidden: {
    title: "Hidden",
    description: "Store data without showing a visible input.",
  },
  single_select: {
    title: "Single select",
    description: "Show one selectable choice from a list.",
  },
  multiple_select: {
    title: "Multiple select",
    description: "Let respondents select more than one option.",
  },
  rating: {
    title: "Rating",
    description: "Collect a score or satisfaction rating.",
  },
  file_upload: {
    title: "File upload",
    description: "Request files or documents.",
  },
  signature: {
    title: "Signature",
    description: "Capture a drawn signature.",
  },
  time: {
    title: "Time",
    description: "Ask for a time of day.",
  },
  turnstile: {
    title: "Turnstile",
    description: "Protect the form from bots.",
  },
  url: {
    title: "URL",
    description: "Collect a website or link.",
  },
  mobile_number: {
    title: "Mobile number",
    description: "Collect a phone number.",
  },
};

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

function readTextValue(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return (
    Object.values(value).find(
      (entry): entry is string => typeof entry === "string",
    ) ?? ""
  );
}

function getSectionFlowSummary(section: IDeclarativeFormSection) {
  const next = section.next;

  if (next === undefined || next === null) {
    return "Continues to the next section";
  }

  if (next === "done") {
    return "Completes the form";
  }

  if (typeof next === "string") {
    if (next.startsWith("https://")) {
      return "Redirects to a URL";
    }

    return "Routes to another section";
  }

  if (Array.isArray(next) && next.length > 0) {
    return "Uses conditional routing";
  }

  return "Continues to the next section";
}

export function Section({
  section,
  index,
  sections,
  canMoveUp,
  canMoveDown,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  section: IDeclarativeFormSection;
  index: number;
  sections: IDeclarativeFormSection[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (nextSection: IDeclarativeFormSection) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
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

  const handleAddField = (type: SupportedFieldType) => {
    const fields = section.fields ?? [];
    const nextField = createDefaultField(type, createFieldId(fields, type));

    onChange({
      ...section,
      fields: [...fields, nextField],
    });
    setIsAddFieldOpen(false);
  };

  return (
    <Item
      variant="outline"
      className="bg-white"
    >
      <ItemHeader>
        <ItemContent>
          <ItemTitle>
            {readTextValue(section.title) || "Untitled Section"}
          </ItemTitle>
          <ItemDescription>
            {section.id || `section_${index + 1}`} •{" "}
            {section.fields?.length ?? 0}{" "}
            {(section.fields?.length ?? 0) === 1 ? "field" : "fields"} •{" "}
            {getSectionFlowSummary(section)}
          </ItemDescription>
        </ItemContent>

        <ItemActions>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>

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
          <div className="rounded-xl bg-muted/20 p-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Title</FieldLabel>
                <FieldDescription>
                  Use a clear section title so respondents understand what comes
                  next.
                </FieldDescription>
                <Input
                  className="bg-background shadow-sm"
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
                <FieldDescription>
                  This ID is used for navigation rules and internal references.
                </FieldDescription>
                <Input
                  className="bg-background shadow-sm"
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
                <FieldDescription>
                  Choose what happens after a respondent finishes this section.
                </FieldDescription>
                <Select value={currentMode} onValueChange={handleModeChange}>
                  <SelectTrigger className="w-full bg-background shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_in_order">
                      Continue to next section
                    </SelectItem>
                    <SelectItem value="section">
                      Go to specific section
                    </SelectItem>
                    <SelectItem value="conditional">
                      Conditional logic
                    </SelectItem>
                    <SelectItem value="external">Redirect to URL</SelectItem>
                    <SelectItem value="done">Complete form</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {currentMode === "section" ? (
                <Field>
                  <FieldLabel>Target section</FieldLabel>
                  <FieldDescription>
                    Send respondents to a specific section instead of following
                    the default order.
                  </FieldDescription>
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
                      <SelectTrigger className="w-full bg-background shadow-sm">
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
                  <FieldDescription>
                    Use a full HTTPS URL for the destination after this section.
                  </FieldDescription>
                  <Input
                    className="bg-background shadow-sm"
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
                    <div className="space-y-1">
                      <FieldLabel>Conditional logic</FieldLabel>
                      <FieldDescription>
                        Evaluate rules in order. The first match decides where
                        the respondent goes next.
                      </FieldDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-background shadow-sm hover:bg-background"
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
                        className="bg-white"
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
                              <Trash2 />
                            </Button>
                          </div>

                          <FieldGroup>
                            <Field>
                              <FieldLabel>When (expression)</FieldLabel>
                              <FieldDescription>
                                Write an expression based on earlier answers,
                                such as a field value check.
                              </FieldDescription>
                              <Input
                                value={rule.when}
                                placeholder="{{data.field_id}} === 'yes'"
                                className="bg-background font-mono text-xs shadow-sm"
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
                              <FieldDescription>
                                Choose the destination when this rule matches.
                              </FieldDescription>
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
                                <SelectTrigger className="w-full bg-background shadow-sm">
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
                      <FieldDescription>
                        Fallback destination when none of the conditions match.
                      </FieldDescription>
                      <Select
                        value={elseFallback}
                        onValueChange={handleElseFallbackChange}
                      >
                        <SelectTrigger className="w-full bg-background shadow-sm">
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
                <FieldDescription>
                  Add and reorder the questions that belong to this section.
                </FieldDescription>
                <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-background shadow-sm hover:bg-background"
                    onClick={() => setIsAddFieldOpen(true)}
                  >
                    <Plus />
                    Add Field
                  </Button>
                  <DialogContent className="max-h-[min(80vh,40rem)] sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Field</DialogTitle>
                      <DialogDescription>
                        Pick the input that best matches the answer you want to
                        collect. You can refine labels, validation, and advanced
                        settings after adding it.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto pr-1">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {BUILDER_FIELD_TYPES.map((fieldType) => (
                          <Button
                            key={fieldType}
                            variant="outline"
                            className="h-auto w-full justify-start bg-background px-4 py-3 text-left shadow-sm hover:bg-muted/20"
                            onClick={() => handleAddField(fieldType)}
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-foreground">
                                {FIELD_TYPE_DETAILS[fieldType].title}
                              </div>
                              <div className="text-xs leading-5 text-muted-foreground">
                                {FIELD_TYPE_DETAILS[fieldType].description}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                                currentFieldIndex === fieldIndex
                                  ? x
                                  : fieldItem,
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
                    <Item
                      variant="outline"
                      className="bg-white"
                    >
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
        </div>
      ) : null}
    </Item>
  );
}
