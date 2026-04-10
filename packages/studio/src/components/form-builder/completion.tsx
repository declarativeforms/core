import { Plus, Trash2 } from "lucide-react";

import {
  Button,
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
  Textarea,
} from "@/components";
import type {
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
  ILocalizedText,
} from "@declarativeforms/types";

type CompletionValue =
  | IDeclarativeFormCompletion
  | IDeclarativeFormCompletionRule[]
  | undefined;

type ParsedCompletion = {
  title: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
};

type ParsedCompletionRule = ParsedCompletion & {
  when: string;
};

const EMPTY_COMPLETION: ParsedCompletion = {
  title: "",
  message: "",
  buttonLabel: "",
  buttonUrl: "",
};

function readText(value: ILocalizedText | undefined) {
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

function parseSimpleCompletion(completion: CompletionValue): ParsedCompletion {
  if (!completion || Array.isArray(completion)) {
    return EMPTY_COMPLETION;
  }

  return {
    title: readText(completion.title),
    message: readText(completion.message),
    buttonLabel: readText(completion.button?.label),
    buttonUrl: readText(completion.button?.url),
  };
}

function parseCompletionRules(
  completion: CompletionValue,
): ParsedCompletionRule[] {
  if (!Array.isArray(completion)) {
    return [];
  }

  return completion.map((rule) => ({
    when: typeof rule.when === "string" ? rule.when : "",
    title: readText(rule.title),
    message: readText(rule.message),
    buttonLabel: readText(rule.button?.label),
    buttonUrl: readText(rule.button?.url),
  }));
}

function buildCompletion(
  parsed: ParsedCompletion,
): IDeclarativeFormCompletion | undefined {
  const result: IDeclarativeFormCompletion = {};

  if (parsed.title.trim()) {
    result.title = parsed.title;
  }

  if (parsed.message.trim()) {
    result.message = parsed.message;
  }

  if (parsed.buttonLabel.trim() || parsed.buttonUrl.trim()) {
    result.button = {};

    if (parsed.buttonLabel.trim()) {
      result.button.label = parsed.buttonLabel;
    }

    if (parsed.buttonUrl.trim()) {
      result.button.url = parsed.buttonUrl;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function buildCompletionRule(
  rule: ParsedCompletionRule,
): IDeclarativeFormCompletionRule {
  const result: IDeclarativeFormCompletionRule = buildCompletion(rule) ?? {};

  if (rule.when.trim()) {
    result.when = rule.when;
  }

  return result;
}

function buildCompletionRules(
  rules: ParsedCompletionRule[],
): IDeclarativeFormCompletionRule[] {
  return rules.map(buildCompletionRule);
}

function CompletionFields({
  completion,
  onChange,
}: {
  completion: ParsedCompletion;
  onChange: (nextCompletion: ParsedCompletion) => void;
}) {
  return (
    <>
      <Field>
        <FieldLabel>Title</FieldLabel>
        <FieldDescription>
          The main message shown after a successful submission.
        </FieldDescription>
        <Input
          className="bg-background shadow-sm"
          value={completion.title}
          placeholder="Thank you!"
          onChange={(event) =>
            onChange({
              ...completion,
              title: event.target.value,
            })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Message</FieldLabel>
        <FieldDescription>
          Add a short follow-up message so respondents know what happens next.
        </FieldDescription>
        <Textarea
          rows={6}
          className="min-h-24 resize-none bg-background shadow-sm"
          value={completion.message}
          placeholder="Thanks for submitting your response."
          onChange={(event) =>
            onChange({
              ...completion,
              message: event.target.value,
            })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Button label</FieldLabel>
        <Input
          className="bg-background shadow-sm"
          value={completion.buttonLabel}
          placeholder="Visit our website"
          onChange={(event) =>
            onChange({
              ...completion,
              buttonLabel: event.target.value,
            })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Button URL</FieldLabel>
        <Input
          className="bg-background shadow-sm"
          value={completion.buttonUrl}
          placeholder="https://example.com"
          onChange={(event) =>
            onChange({
              ...completion,
              buttonUrl: event.target.value,
            })
          }
        />
      </Field>
    </>
  );
}

function getRuleForSimpleCompletion(
  rules: ParsedCompletionRule[],
): ParsedCompletionRule | undefined {
  return rules.find((rule) => rule.when.trim() === "") ?? rules[0];
}

export function Completion({
  completion,
  onChange,
}: {
  completion: CompletionValue;
  onChange: (nextCompletion: CompletionValue) => void;
}) {
  const isConditional = Array.isArray(completion);
  const simpleCompletion = parseSimpleCompletion(completion);
  const conditionalRules = parseCompletionRules(completion);

  const handleSimpleChange = (nextCompletion: ParsedCompletion) => {
    onChange(buildCompletion(nextCompletion));
  };

  const handleSwitchToConditional = () => {
    onChange(
      buildCompletionRules([
        {
          ...simpleCompletion,
          when: "",
        },
      ]),
    );
  };

  const handleSwitchToSimple = () => {
    const nextCompletion = getRuleForSimpleCompletion(conditionalRules);
    onChange(buildCompletion(nextCompletion ?? EMPTY_COMPLETION));
  };

  const handleUpdateRule = (index: number, nextRule: ParsedCompletionRule) => {
    onChange(
      buildCompletionRules(
        conditionalRules.map((rule, ruleIndex) =>
          ruleIndex === index ? nextRule : rule,
        ),
      ),
    );
  };

  const handleAddRule = () => {
    onChange(
      buildCompletionRules([
        ...conditionalRules,
        {
          ...EMPTY_COMPLETION,
          when: "",
        },
      ]),
    );
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = conditionalRules.filter(
      (_, ruleIndex) => ruleIndex !== index,
    );

    if (updatedRules.length === 0) {
      onChange(buildCompletion(conditionalRules[index] ?? EMPTY_COMPLETION));
      return;
    }

    onChange(buildCompletionRules(updatedRules));
  };

  if (!isConditional) {
    return (
      <div className="space-y-3">
        <FieldGroup>
          <CompletionFields
            completion={simpleCompletion}
            onChange={handleSimpleChange}
          />
        </FieldGroup>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start bg-background shadow-sm hover:bg-background"
          onClick={handleSwitchToConditional}
        >
          <Plus />
          Add Conditional Rules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ItemGroup className="gap-3">
        {conditionalRules.map((rule, index) => (
          <Item
            key={`completion-rule-${index}`}
            variant="outline"
            className="bg-white"
          >
            <ItemHeader>
              <ItemContent>
                <ItemTitle>
                  {rule.when.trim() ? `Rule ${index + 1}` : "Default"}
                </ItemTitle>
                <ItemDescription>
                  {rule.when.trim()
                    ? rule.when
                    : "Shown when no earlier completion rule matches."}
                </ItemDescription>
              </ItemContent>

              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveRule(index)}
                >
                  <Trash2 />
                </Button>
              </ItemActions>
            </ItemHeader>

            <div className="basis-full border-t border-border pt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Condition (expression)</FieldLabel>
                  <Input
                    className="bg-background font-mono text-xs shadow-sm"
                    value={rule.when}
                    placeholder="Leave empty for default"
                    onChange={(event) =>
                      handleUpdateRule(index, {
                        ...rule,
                        when: event.target.value,
                      })
                    }
                  />
                </Field>

                <CompletionFields
                  completion={rule}
                  onChange={(nextCompletion) =>
                    handleUpdateRule(index, {
                      ...nextCompletion,
                      when: rule.when,
                    })
                  }
                />
              </FieldGroup>
            </div>
          </Item>
        ))}
      </ItemGroup>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start bg-background shadow-sm hover:bg-background"
        onClick={handleAddRule}
      >
        <Plus />
        Add Rule
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={handleSwitchToSimple}
      >
        Switch to simple completion
      </Button>
    </div>
  );
}
