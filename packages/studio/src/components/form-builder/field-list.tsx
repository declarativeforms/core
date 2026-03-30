import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";

import type { IDeclarativeFormField } from "@/lib/declarative-form-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  BUILDER_FIELD_TYPES,
  type SupportedFieldType,
  getFieldDisplayLabel,
  getFieldTypeIcon,
  getFieldTypeLabel,
  getEditableFieldType,
} from "./shared";

type FieldListProps = {
  fields: IDeclarativeFormField[];
  selectedFieldIndex: number | null;
  canAddField: boolean;
  onSelectField: (index: number) => void;
  onAddField: (type: SupportedFieldType) => void;
};

export function FieldList({
  fields,
  selectedFieldIndex,
  canAddField,
  onSelectField,
  onAddField,
}: FieldListProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fields
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {!canAddField ? (
          <div className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground">
            Select or add a section to start adding fields.
          </div>
        ) : fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground">
            No fields in this section yet.
          </div>
        ) : (
          fields.map((field, index) => {
            const Icon = getFieldTypeIcon(getEditableFieldType(field));

            return (
              <button
                key={field.id ?? `field-${index}`}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                  selectedFieldIndex === index &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => onSelectField(index)}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getFieldDisplayLabel(field)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getFieldTypeLabel(getEditableFieldType(field))}
                  </p>
                </div>
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={!canAddField}
            >
              <Plus />
              Add Field
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Field</DialogTitle>
              <DialogDescription>
                Choose the type of field to add to this section.
              </DialogDescription>
            </DialogHeader>

            <div className="grid max-h-[70vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {BUILDER_FIELD_TYPES.map((fieldType) => {
                const Icon = getFieldTypeIcon(fieldType);

                return (
                  <button
                    key={fieldType}
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onAddField(fieldType);
                      setIsPickerOpen(false);
                    }}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{getFieldTypeLabel(fieldType)}</span>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
