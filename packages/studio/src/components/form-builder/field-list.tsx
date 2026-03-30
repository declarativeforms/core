import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";

import type { IDeclarativeFormField } from "@/lib/declarative-form-types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

import { BuilderPane, BuilderPaneEmptyState } from "./panel-shell";
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
    <BuilderPane
      title="Fields"
      footer={
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
      }
      bodyClassName="space-y-1"
    >
        {!canAddField ? (
          <BuilderPaneEmptyState>
            Select or add a section to start adding fields.
          </BuilderPaneEmptyState>
        ) : fields.length === 0 ? (
          <BuilderPaneEmptyState>
            No fields in this section yet.
          </BuilderPaneEmptyState>
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
    </BuilderPane>
  );
}
