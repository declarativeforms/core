import type { IDeclarativeForm } from "@/lib/declarative-form-types";
import { Input, Label } from "@/components/ui";

import { LocalizedTextEditor } from "./localized-text-editor";
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
    <div className="space-y-5">
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

      <div className="border-t border-border pt-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Localization
        </p>
        <div className="space-y-1.5">
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

      <div className="border-t border-border pt-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Scheduling
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

      <div className="border-t border-border pt-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Analytics
        </p>
        <div className="space-y-1.5">
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

      <div className="border-t border-border pt-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Appearance
        </p>
        <div className="space-y-1.5">
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
              className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
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

      <div className="border-t border-border pt-5">
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
