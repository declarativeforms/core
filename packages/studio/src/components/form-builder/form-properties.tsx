import type { IDeclarativeForm } from "@/lib/declarative-form-types";
import { Input, Label, Textarea } from "@/components/ui";

type FormPropertiesProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
};

function getTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}

export function FormProperties({ form, onChange }: FormPropertiesProps) {
  const title = getTextValue(form.title);
  const description = getTextValue(form.description);
  const startDate = form.start_date ?? "";
  const endDate = form.end_date ?? "";
  const primaryColor = form.theme?.primary ?? "";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Untitled Form"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="A short description of this form"
          className="min-h-20 resize-none"
        />
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
              onChange={(e) => onChange({ ...form, start_date: e.target.value || undefined })}
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
              onChange={(e) => onChange({ ...form, end_date: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground">
              The form will stop accepting submissions after this date.
            </p>
          </div>
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
              onChange={(e) =>
                onChange({
                  ...form,
                  theme: { ...form.theme, primary: e.target.value },
                })
              }
              className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <Input
              value={primaryColor}
              onChange={(e) =>
                onChange({
                  ...form,
                  theme: { ...form.theme, primary: e.target.value || undefined },
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
    </div>
  );
}
