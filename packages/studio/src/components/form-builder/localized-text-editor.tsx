import { Languages, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { ILocalizedText } from "@/lib/declarative-form-types";
import {
  buildLocalizedTextFromEntries,
  createNextLocaleKey,
  getDefaultLocale,
  getLocalizedTextEntries,
  getLocalizedTextPreview,
  isLocalizedTextObject,
} from "@/lib/localized-text";
import { cn } from "@/lib/utils";
import { Button, Input, Label, Textarea } from "@/components/ui";

type LocalizedTextEditorProps = {
  label: string;
  value: ILocalizedText | undefined;
  onChange: (nextValue: ILocalizedText) => void;
  defaultLocale?: string;
  placeholder?: string;
  description?: string;
  multiline?: boolean;
  id?: string;
  className?: string;
  labelClassName?: string;
};

export function LocalizedTextEditor({
  label,
  value,
  onChange,
  defaultLocale,
  placeholder,
  description,
  multiline = false,
  id,
  className,
  labelClassName,
}: LocalizedTextEditorProps) {
  const [mode, setMode] = useState<"simple" | "localized">(
    isLocalizedTextObject(value) ? "localized" : "simple",
  );
  const resolvedDefaultLocale = getDefaultLocale(defaultLocale);

  useEffect(() => {
    setMode(isLocalizedTextObject(value) ? "localized" : "simple");
  }, [value]);

  const preview = getLocalizedTextPreview(value);
  const entries = getLocalizedTextEntries(value);
  const localizedEntries =
    entries.length > 0
      ? entries
      : [{ locale: resolvedDefaultLocale, value: preview }];

  const handleSwitchToLocalized = () => {
    setMode("localized");
    onChange(
      buildLocalizedTextFromEntries([
        {
          locale: resolvedDefaultLocale,
          value: preview,
        },
      ]),
    );
  };

  const handleSwitchToSimple = () => {
    setMode("simple");
    onChange(preview);
  };

  const handleUpdateEntry = (
    index: number,
    field: "locale" | "value",
    nextValue: string,
  ) => {
    const nextEntries = localizedEntries.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: nextValue } : entry,
    );

    onChange(buildLocalizedTextFromEntries(nextEntries));
  };

  const handleRemoveEntry = (index: number) => {
    const nextEntries = localizedEntries.filter((_, entryIndex) => entryIndex !== index);

    onChange(
      buildLocalizedTextFromEntries(
        nextEntries.length > 0
          ? nextEntries
          : [{ locale: resolvedDefaultLocale, value: "" }],
      ),
    );
  };

  const InputComponent = multiline ? Textarea : Input;

  if (mode === "simple") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id} className={labelClassName}>
            {label}
          </Label>
          <Button type="button" variant="ghost" size="xs" onClick={handleSwitchToLocalized}>
            <Languages className="size-3.5" />
            Use locales
          </Button>
        </div>

        <InputComponent
          id={id}
          value={preview}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={multiline ? "min-h-20 resize-none" : undefined}
        />

        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-xl border border-border bg-muted/10 p-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label className={labelClassName}>{label}</Label>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <Button type="button" variant="ghost" size="xs" onClick={handleSwitchToSimple}>
          Use single value
        </Button>
      </div>

      <div className="space-y-3">
        {localizedEntries.map((entry, index) => (
          <div
            key={`${entry.locale}-${index}`}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Locale {index + 1}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove locale"
                onClick={() => handleRemoveEntry(index)}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Locale code</Label>
                <Input
                  value={entry.locale}
                  onChange={(event) => handleUpdateEntry(index, "locale", event.target.value)}
                  placeholder={resolvedDefaultLocale}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Value</Label>
                <InputComponent
                  value={entry.value}
                  onChange={(event) => handleUpdateEntry(index, "value", event.target.value)}
                  placeholder={placeholder}
                  className={multiline ? "min-h-20 resize-none" : undefined}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => {
          const nextEntries = [
            ...localizedEntries,
            {
              locale: createNextLocaleKey(localizedEntries, resolvedDefaultLocale),
              value: "",
            },
          ];

          onChange(buildLocalizedTextFromEntries(nextEntries));
        }}
      >
        <Plus />
        Add Locale
      </Button>
    </div>
  );
}
