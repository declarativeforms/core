import { GripVertical, Plus, Settings } from "lucide-react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onReorderFields: (fromIndex: number, toIndex: number) => void;
  onViewSectionSettings: () => void;
};

type SortableFieldItemProps = {
  field: IDeclarativeFormField;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
};

function SortableFieldItem({ field, index, isSelected, onSelect }: SortableFieldItemProps) {
  const fieldId = field.id ?? `field-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getFieldTypeIcon(getEditableFieldType(field));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-full items-center gap-1 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        isDragging && "z-10 opacity-80 shadow-md",
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reorder ${getFieldDisplayLabel(field)}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-3 text-left"
        onClick={onSelect}
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
      </button>
    </div>
  );
}

export function FieldList({
  fields,
  selectedFieldIndex,
  canAddField,
  onSelectField,
  onAddField,
  onReorderFields,
  onViewSectionSettings,
}: FieldListProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fieldIds = fields.map((field, index) => field.id ?? `field-${index}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fieldIds.indexOf(String(active.id));
    const newIndex = fieldIds.indexOf(String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderFields(oldIndex, newIndex);
    }
  };

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
        ) : (
          <>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                selectedFieldIndex === null && "bg-accent text-accent-foreground",
              )}
              onClick={onViewSectionSettings}
            >
              <Settings className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Section Settings</p>
                <p className="truncate text-xs text-muted-foreground">
                  Navigation &amp; Properties
                </p>
              </div>
            </button>

            {fields.length === 0 ? (
              <BuilderPaneEmptyState>
                No fields in this section yet.
              </BuilderPaneEmptyState>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                  {fields.map((field, index) => (
                    <SortableFieldItem
                      key={field.id ?? `field-${index}`}
                      field={field}
                      index={index}
                      isSelected={selectedFieldIndex === index}
                      onSelect={() => onSelectField(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
    </BuilderPane>
  );
}
