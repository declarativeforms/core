import { Plus, Trash2 } from "lucide-react";

import type {
  IDeclarativeForm,
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
  ILocalizedText,
} from "@declarativeforms/types";
import { hasLocalizedTextContent } from "@/lib/localized-text";
import { Button, Input, Label } from "@/components/ui";

import { LocalizedTextEditor } from "./localized-text-editor";
import { BuilderInset, BuilderSectionTitle } from "./panel-shell";

type CompletionEditorProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
};

type ParsedCompletion = {
  title: ILocalizedText | undefined;
  message: ILocalizedText | undefined;
  buttonLabel: ILocalizedText | undefined;
  buttonUrl: ILocalizedText | undefined;
};

type ParsedCompletionRule = ParsedCompletion & {
  when: string;
};

function parseSimpleCompletion(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[] | undefined,
): ParsedCompletion | null {
  if (!completion || Array.isArray(completion)) {
    return null;
  }

  return {
    title: completion.title,
    message: completion.message,
    buttonLabel: completion.button?.label,
    buttonUrl: completion.button?.url,
  };
}

function parseCompletionRules(
  completion: IDeclarativeFormCompletion | IDeclarativeFormCompletionRule[] | undefined,
): ParsedCompletionRule[] {
  if (!Array.isArray(completion)) {
    return [];
  }

  return completion.map((rule) => ({
    when: typeof rule.when === "string" ? rule.when : "",
    title: rule.title,
    message: rule.message,
    buttonLabel: rule.button?.label,
    buttonUrl: rule.button?.url,
  }));
}

function buildCompletion(parsed: ParsedCompletion): IDeclarativeFormCompletion {
  const result: IDeclarativeFormCompletion = {};

  if (hasLocalizedTextContent(parsed.title)) {
    result.title = parsed.title;
  }

  if (hasLocalizedTextContent(parsed.message)) {
    result.message = parsed.message;
  }

  if (
    hasLocalizedTextContent(parsed.buttonLabel) ||
    hasLocalizedTextContent(parsed.buttonUrl)
  ) {
    result.button = {};

    if (hasLocalizedTextContent(parsed.buttonLabel)) {
      result.button.label = parsed.buttonLabel;
    }

    if (hasLocalizedTextContent(parsed.buttonUrl)) {
      result.button.url = parsed.buttonUrl;
    }
  }

  return result;
}

function buildCompletionRules(rules: ParsedCompletionRule[]): IDeclarativeFormCompletionRule[] {
  return rules.map((rule) => {
    const result: IDeclarativeFormCompletionRule = {};

    if (rule.when.trim()) {
      result.when = rule.when;
    }

    if (hasLocalizedTextContent(rule.title)) {
      result.title = rule.title;
    }

    if (hasLocalizedTextContent(rule.message)) {
      result.message = rule.message;
    }

    if (
      hasLocalizedTextContent(rule.buttonLabel) ||
      hasLocalizedTextContent(rule.buttonUrl)
    ) {
      result.button = {};

      if (hasLocalizedTextContent(rule.buttonLabel)) {
        result.button.label = rule.buttonLabel;
      }

      if (hasLocalizedTextContent(rule.buttonUrl)) {
        result.button.url = rule.buttonUrl;
      }
    }

    return result;
  });
}

function CompletionFields({
  parsed,
  onChange,
  defaultLocale,
}: {
  parsed: ParsedCompletion;
  onChange: (next: ParsedCompletion) => void;
  defaultLocale?: string;
}) {
  return (
    <div className="space-y-3">
      <LocalizedTextEditor
        label="Title"
        value={parsed.title}
        onChange={(title) => onChange({ ...parsed, title })}
        defaultLocale={defaultLocale}
        placeholder="Thank you!"
      />

      <LocalizedTextEditor
        label="Message"
        value={parsed.message}
        onChange={(message) => onChange({ ...parsed, message })}
        defaultLocale={defaultLocale}
        placeholder="Thanks for submitting your response."
        multiline
      />

      <LocalizedTextEditor
        label="Button label"
        value={parsed.buttonLabel}
        onChange={(buttonLabel) => onChange({ ...parsed, buttonLabel })}
        defaultLocale={defaultLocale}
        placeholder="e.g. Visit our website"
      />

      <LocalizedTextEditor
        label="Button URL"
        value={parsed.buttonUrl}
        onChange={(buttonUrl) => onChange({ ...parsed, buttonUrl })}
        defaultLocale={defaultLocale}
        placeholder="https://example.com"
      />
    </div>
  );
}

export function CompletionEditor({ form, onChange }: CompletionEditorProps) {
  const isConditional = Array.isArray(form.completion);
  const simpleCompletion = parseSimpleCompletion(form.completion) ?? {
    title: undefined,
    message: undefined,
    buttonLabel: undefined,
    buttonUrl: undefined,
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
        first ?? {
          title: undefined,
          message: undefined,
          buttonLabel: undefined,
          buttonUrl: undefined,
        },
      ),
    });
  };

  const handleUpdateRule = (index: number, next: ParsedCompletionRule) => {
    const updatedRules = conditionalRules.map((rule, ruleIndex) =>
      ruleIndex === index ? next : rule,
    );
    onChange({ ...form, completion: buildCompletionRules(updatedRules) });
  };

  const handleAddRule = () => {
    const newRule: ParsedCompletionRule = {
      when: "",
      title: undefined,
      message: undefined,
      buttonLabel: undefined,
      buttonUrl: undefined,
    };

    onChange({
      ...form,
      completion: buildCompletionRules([...conditionalRules, newRule]),
    });
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = conditionalRules.filter((_, ruleIndex) => ruleIndex !== index);

    if (updatedRules.length === 0) {
      onChange({ ...form, completion: buildCompletion(simpleCompletion) });
      return;
    }

    onChange({ ...form, completion: buildCompletionRules(updatedRules) });
  };

  return (
    <div className="space-y-4">
      {!isConditional ? (
        <>
          <CompletionFields
            parsed={simpleCompletion}
            onChange={handleSimpleChange}
            defaultLocale={form.locale}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleSwitchToConditional}
          >
            Add conditional completion rules
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-3">
            {conditionalRules.map((rule, index) => (
              <BuilderInset
                key={index}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <BuilderSectionTitle className="leading-none">
                    {rule.when ? `Rule ${index + 1}` : "Default"}
                  </BuilderSectionTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveRule(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Condition (expression)</Label>
                  <Input
                    value={rule.when}
                    onChange={(event) =>
                      handleUpdateRule(index, { ...rule, when: event.target.value })
                    }
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
                  defaultLocale={form.locale}
                />
              </BuilderInset>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleAddRule}
          >
            <Plus className="size-4" />
            Add Rule
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleSwitchToSimple}
          >
            Switch to simple completion
          </Button>
        </>
      )}
    </div>
  );
}
