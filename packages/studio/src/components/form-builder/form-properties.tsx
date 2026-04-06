import type { IDeclarativeForm } from "@declarativeforms/types";
import { Input, Label } from "@/components/ui";

import { LocalizedTextEditor } from "./localized-text-editor";
import { BuilderSectionTitle } from "./panel-shell";
import { WebhookConnectionsEditor } from "./webhook-connections-editor";

type FormPropertiesProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
};

export function FormProperties({ form, onChange }: FormPropertiesProps) {
  const startDate = form.start_date ?? "";
  const endDate = form.end_date ?? "";
  const primaryColor = form.theme?.primary ?? "";
  const locale = form.locale ?? "";
  const mixpanelToken = form.measurements?.mixpanel ?? "";

  return (
    <div className="space-y-4">
      <LocalizedTextEditor
        label="Title"
        value={form.title}
        onChange={(title) => onChange({ ...form, title })}
        defaultLocale={form.locale}
        placeholder="Untitled Form"
      />

      <LocalizedTextEditor
        label="Description"
        value={form.description}
        onChange={(description) => onChange({ ...form, description })}
        defaultLocale={form.locale}
        placeholder="A short description of this form"
        multiline
      />

      <div className="space-y-3 border-t border-border pt-4">
        <BuilderSectionTitle>Localization</BuilderSectionTitle>
        <div className="space-y-2">
          <Label>Default locale</Label>
          <Input
            value={locale}
            onChange={(event) =>
              onChange({
                ...form,
                locale: event.target.value || undefined,
              })
            }
            placeholder="en"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Used as the default locale for localized content and published forms.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <BuilderSectionTitle>Scheduling</BuilderSectionTitle>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) =>
                onChange({ ...form, start_date: event.target.value || undefined })
              }
            />
            <p className="text-xs text-muted-foreground">
              The form will not accept submissions before this date.
            </p>
          </div>

          <div className="space-y-2">
            <Label>End date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) =>
                onChange({ ...form, end_date: event.target.value || undefined })
              }
            />
            <p className="text-xs text-muted-foreground">
              The form will stop accepting submissions after this date.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <BuilderSectionTitle>Analytics</BuilderSectionTitle>
        <div className="space-y-2">
          <Label>Mixpanel token</Label>
          <Input
            value={mixpanelToken}
            onChange={(event) =>
              onChange({
                ...form,
                measurements: {
                  ...form.measurements,
                  mixpanel: event.target.value || undefined,
                },
              })
            }
            placeholder="Mixpanel project token"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Initializes Mixpanel tracking for the published form when set.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <BuilderSectionTitle>Appearance</BuilderSectionTitle>
        <div className="space-y-2">
          <Label>Primary color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor || "#6366f1"}
              onChange={(event) =>
                onChange({
                  ...form,
                  theme: { ...form.theme, primary: event.target.value },
                })
              }
              className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-background p-0.5"
            />
            <Input
              value={primaryColor}
              onChange={(event) =>
                onChange({
                  ...form,
                  theme: { ...form.theme, primary: event.target.value || undefined },
                })
              }
              placeholder="#6366f1"
              className="font-mono text-xs"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for buttons and interactive elements in the published form.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <WebhookConnectionsEditor
          connections={form.connections}
          onChange={(connections) =>
            onChange({
              ...form,
              connections,
            })
          }
        />
      </div>
    </div>
  );
}
