import { Plus, Trash2 } from "lucide-react";

import type { IDeclarativeFormSection } from "@/lib/declarative-form-types";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";

import { BuilderPaneHeader } from "./panel-shell";

type SectionPropertiesProps = {
  section: IDeclarativeFormSection | null;
  allSections: IDeclarativeFormSection[];
  onChange: (nextSection: IDeclarativeFormSection) => void;
  showHeader?: boolean;
  className?: string;
  contentClassName?: string;
};

type NextMode = "next_in_order" | "section" | "conditional" | "external" | "done";

type ConditionalRule = {
  when: string;
  go: string;
};

function parseNextMode(section: IDeclarativeFormSection | null): NextMode {
  if (!section) {
    return "next_in_order";
  }

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

function parseNextSectionId(section: IDeclarativeFormSection | null): string {
  if (!section || typeof section.next !== "string") {
    return "";
  }

  return section.next;
}

function parseExternalUrl(section: IDeclarativeFormSection | null): string {
  if (!section || typeof section.next !== "string") {
    return "";
  }

  return section.next.startsWith("https://") ? section.next : "";
}

function parseConditionalRules(section: IDeclarativeFormSection | null): ConditionalRule[] {
  if (!section || !Array.isArray(section.next)) {
    return [];
  }

  return section.next
    .filter((rule): rule is { when?: string; go?: string } => "when" in rule || "go" in rule)
    .map((rule) => ({
      when: rule.when ?? "",
      go: rule.go ?? "",
    }));
}

function parseElseFallback(section: IDeclarativeFormSection | null): string {
  if (!section || !Array.isArray(section.next)) {
    return "done";
  }

  const elseRule = section.next.find((rule): rule is { else?: string } => "else" in rule);

  return elseRule?.else ?? "done";
}

export function SectionProperties({
  section,
  allSections,
  onChange,
  showHeader = false,
  className,
  contentClassName,
}: SectionPropertiesProps) {
  if (!section) {
    return (
      showHeader ? (
        <div className={cn("flex h-full flex-col", className)}>
          <BuilderPaneHeader title="Section Settings" />
          <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
            Select a section to configure its settings.
          </div>
        </div>
      ) : (
        <div className={cn("p-4 text-sm text-muted-foreground", className)}>
          Select a section to configure its settings.
        </div>
      )
    );
  }

  const currentMode = parseNextMode(section);
  const otherSections = allSections.filter((s) => s.id && s.id !== section.id);
  const conditionalRules = parseConditionalRules(section);
  const elseFallback = parseElseFallback(section);

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
          next: [{ when: "", go: otherSections[0]?.id ?? "done" }, { else: "done" }],
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

  const handleUpdateConditionalRule = (index: number, field: keyof ConditionalRule, value: string) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const nextRules = [...section.next];
    const whenGoRules = nextRules.filter((rule) => "when" in rule || "go" in rule);
    const elseRule = nextRules.find((rule) => "else" in rule);

    if (index < whenGoRules.length) {
      whenGoRules[index] = { ...whenGoRules[index], [field]: value };
    }

    const updatedNext = [...whenGoRules, ...(elseRule ? [elseRule] : [{ else: "done" }])];
    onChange({ ...section, next: updatedNext });
  };

  const handleAddConditionalRule = () => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const elseRule = section.next.find((rule) => "else" in rule) ?? { else: "done" };
    const whenGoRules = section.next.filter((rule) => "when" in rule || "go" in rule);

    onChange({
      ...section,
      next: [...whenGoRules, { when: "", go: otherSections[0]?.id ?? "done" }, elseRule],
    });
  };

  const handleRemoveConditionalRule = (index: number) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter((rule) => "when" in rule || "go" in rule);
    const elseRule = section.next.find((rule) => "else" in rule) ?? { else: "done" };

    const updatedWhenGo = whenGoRules.filter((_, i) => i !== index);

    if (updatedWhenGo.length === 0) {
      onChange({ ...section, next: undefined });
      return;
    }

    onChange({ ...section, next: [...updatedWhenGo, elseRule] });
  };

  const handleElseFallbackChange = (value: string) => {
    if (!Array.isArray(section.next)) {
      return;
    }

    const whenGoRules = section.next.filter((rule) => "when" in rule || "go" in rule);

    onChange({ ...section, next: [...whenGoRules, { else: value }] });
  };

  const content = (
    <>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={typeof section.title === "string" ? section.title : ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Untitled Section"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-id">Section ID</Label>
        <Input id="section-id" value={section.id ?? ""} disabled className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground">
          Used to reference this section in navigation rules.
        </p>
      </div>

      <div className="space-y-2">
        <Label>After this section</Label>
        <Select value={currentMode} onValueChange={handleModeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="next_in_order">Continue to next section</SelectItem>
            <SelectItem value="section">Go to specific section</SelectItem>
            <SelectItem value="conditional">Conditional logic</SelectItem>
            <SelectItem value="external">Redirect to URL</SelectItem>
            <SelectItem value="done">Complete form</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentMode === "section" && (
        <div className="space-y-2">
          <Label>Target section</Label>
          {otherSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add more sections to enable navigation.
            </p>
          ) : (
            <Select value={parseNextSectionId(section)} onValueChange={handleSectionIdChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {otherSections.map((s) => (
                  <SelectItem key={s.id} value={s.id ?? ""}>
                    {typeof s.title === "string" && s.title.trim() ? s.title : s.id ?? "Untitled"}
                  </SelectItem>
                ))}
                <SelectItem value="done">Complete form</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {currentMode === "external" && (
        <div className="space-y-2">
          <Label>Redirect URL</Label>
          <Input
            value={parseExternalUrl(section)}
            onChange={(e) => handleExternalUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
          <p className="text-xs text-muted-foreground">
            The user will be redirected to this URL after completing this section.
          </p>
        </div>
      )}

      {currentMode === "conditional" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {conditionalRules.map((rule, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rule {index + 1}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveConditionalRule(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">When (expression)</Label>
                  <Input
                    value={rule.when}
                    onChange={(e) => handleUpdateConditionalRule(index, "when", e.target.value)}
                    placeholder="e.g. {{field_id}} === 'yes'"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Go to</Label>
                  <Select
                    value={rule.go}
                    onValueChange={(value) => handleUpdateConditionalRule(index, "go", value)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {otherSections.map((s) => (
                        <SelectItem key={s.id} value={s.id ?? ""}>
                          {typeof s.title === "string" && s.title.trim()
                            ? s.title
                            : s.id ?? "Untitled"}
                        </SelectItem>
                      ))}
                      <SelectItem value="done">Complete form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={handleAddConditionalRule}
          >
            <Plus className="size-4" />
            Add Rule
          </Button>

          <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/10 p-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Otherwise
            </Label>
            <Select value={elseFallback} onValueChange={handleElseFallbackChange}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {otherSections.map((s) => (
                  <SelectItem key={s.id} value={s.id ?? ""}>
                    {typeof s.title === "string" && s.title.trim()
                      ? s.title
                      : s.id ?? "Untitled"}
                  </SelectItem>
                ))}
                <SelectItem value="done">Complete form</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </>
  );

  if (showHeader) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        <BuilderPaneHeader title="Section Settings" />
        <div className={cn("flex-1 space-y-5 overflow-y-auto p-4", contentClassName)}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className, contentClassName)}>
      {content}
    </div>
  );
}
