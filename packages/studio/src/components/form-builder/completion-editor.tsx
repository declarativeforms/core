import { Plus, Trash2 } from "lucide-react";

import type {
  IDeclarativeForm,
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
} from "@/lib/declarative-form-types";
import { Button, Input, Label, Textarea } from "@/components/ui";

import { BuilderPaneHeader } from "./panel-shell";

type CompletionEditorProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
};

type ParsedCompletion = {
  title: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
};

type ParsedCompletionRule = ParsedCompletion & {
  when: string;
};

function getTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

function parseSimpleCompletion(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[] | undefined,
): ParsedCompletion | null {
  if (!completion || Array.isArray(completion)) {
    return null;
  }

  return {
    title: getTextValue(completion.title),
    message: getTextValue(completion.message),
    buttonLabel: getTextValue(completion.button?.label),
    buttonUrl: getTextValue(completion.button?.url),
  };
}

function parseCompletionRules(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[] | undefined,
): ParsedCompletionRule[] {
  if (!Array.isArray(completion)) {
    return [];
  }

  return completion.map((rule) => ({
    when: getTextValue((rule as IDeclarativeFormCompletionRule).when),
    title: getTextValue(rule.title),
    message: getTextValue(rule.message),
    buttonLabel: getTextValue(rule.button?.label),
    buttonUrl: getTextValue(rule.button?.url),
  }));
}

function buildCompletion(parsed: ParsedCompletion): IDeclarativeFormCompletion {
  const result: IDeclarativeFormCompletion = {};

  if (parsed.title) {
    result.title = parsed.title;
  }

  if (parsed.message) {
    result.message = parsed.message;
  }

  if (parsed.buttonLabel || parsed.buttonUrl) {
    result.button = {};
    if (parsed.buttonLabel) {
      result.button.label = parsed.buttonLabel;
    }
    if (parsed.buttonUrl) {
      result.button.url = parsed.buttonUrl;
    }
  }

  return result;
}

function buildCompletionRules(rules: ParsedCompletionRule[]): IDeclarativeFormCompletionRule[] {
  return rules.map((rule) => {
    const result: IDeclarativeFormCompletionRule = {};

    if (rule.when) {
      result.when = rule.when;
    }

    if (rule.title) {
      result.title = rule.title;
    }

    if (rule.message) {
      result.message = rule.message;
    }

    if (rule.buttonLabel || rule.buttonUrl) {
      result.button = {};
      if (rule.buttonLabel) {
        result.button.label = rule.buttonLabel;
      }
      if (rule.buttonUrl) {
        result.button.url = rule.buttonUrl;
      }
    }

    return result;
  });
}

function CompletionFields({
  parsed,
  onChange,
}: {
  parsed: ParsedCompletion;
  onChange: (next: ParsedCompletion) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input
          value={parsed.title}
          onChange={(e) => onChange({ ...parsed, title: e.target.value })}
          placeholder="Thank you!"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Message</Label>
        <Textarea
          value={parsed.message}
          onChange={(e) => onChange({ ...parsed, message: e.target.value })}
          placeholder="Thanks for submitting your response."
          className="min-h-20 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Button label</Label>
        <Input
          value={parsed.buttonLabel}
          onChange={(e) => onChange({ ...parsed, buttonLabel: e.target.value })}
          placeholder="e.g. Visit our website"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Button URL</Label>
        <Input
          value={parsed.buttonUrl}
          onChange={(e) => onChange({ ...parsed, buttonUrl: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}

export function CompletionEditor({ form, onChange }: CompletionEditorProps) {
  const isConditional = Array.isArray(form.completion);
  const simpleCompletion = parseSimpleCompletion(form.completion) ?? {
    title: "",
    message: "",
    buttonLabel: "",
    buttonUrl: "",
  };
  const conditionalRules = parseCompletionRules(form.completion);

  const handleSimpleChange = (parsed: ParsedCompletion) => {
    onChange({ ...form, completion: buildCompletion(parsed) });
  };

  const handleSwitchToConditional = () => {
    const defaultRule: ParsedCompletionRule = {
      ...simpleCompletion,
      when: "",
    };

    onChange({
      ...form,
      completion: buildCompletionRules([defaultRule]),
    });
  };

  const handleSwitchToSimple = () => {
    const first = conditionalRules[0];

    onChange({
      ...form,
      completion: buildCompletion(
        first ?? { title: "", message: "", buttonLabel: "", buttonUrl: "" },
      ),
    });
  };

  const handleUpdateRule = (index: number, next: ParsedCompletionRule) => {
    const updatedRules = conditionalRules.map((rule, i) => (i === index ? next : rule));
    onChange({ ...form, completion: buildCompletionRules(updatedRules) });
  };

  const handleAddRule = () => {
    const newRule: ParsedCompletionRule = {
      when: "",
      title: "",
      message: "",
      buttonLabel: "",
      buttonUrl: "",
    };
    onChange({
      ...form,
      completion: buildCompletionRules([...conditionalRules, newRule]),
    });
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = conditionalRules.filter((_, i) => i !== index);

    if (updatedRules.length === 0) {
      onChange({ ...form, completion: buildCompletion(simpleCompletion) });
      return;
    }

    onChange({ ...form, completion: buildCompletionRules(updatedRules) });
  };

  return (
    <div className="flex h-full flex-col">
      <BuilderPaneHeader title="Completion" />
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">
          Configure what users see after completing the form.
        </p>

        {!isConditional ? (
          <>
            <CompletionFields parsed={simpleCompletion} onChange={handleSimpleChange} />

            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={handleSwitchToConditional}
            >
              Add conditional completion rules
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              {conditionalRules.map((rule, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {rule.when ? `Rule ${index + 1}` : "Default"}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveRule(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Condition (expression)</Label>
                    <Input
                      value={rule.when}
                      onChange={(e) => handleUpdateRule(index, { ...rule, when: e.target.value })}
                      placeholder="Leave empty for default"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use as the default fallback completion.
                    </p>
                  </div>

                  <CompletionFields
                    parsed={rule}
                    onChange={(next) => handleUpdateRule(index, { ...next, when: rule.when })}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={handleAddRule}
            >
              <Plus className="size-4" />
              Add Rule
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={handleSwitchToSimple}
            >
              Switch to simple completion
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
