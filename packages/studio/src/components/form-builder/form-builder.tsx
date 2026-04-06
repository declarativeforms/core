import { ChevronDown, GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormSection,
} from "@declarativeforms/types";

import { FieldProperties } from "./field-properties";
import { BuilderInset, BuilderSectionTitle } from "./panel-shell";
import { SectionProperties } from "./section-properties";
import {
  BUILDER_FIELD_TYPES,
  createDefaultField,
  type SupportedFieldType,
  getEditableFieldType,
  getFieldDisplayLabel,
  getFieldTypeIcon,
  getFieldTypeLabel,
  getSectionDisplayTitle,
} from "./shared";

type FormBuilderProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
};

type ExpandedPanel =
  | { type: "section" }
  | { type: "field"; index: number }
  | null;

type InlineEditorCardProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  dragHandle?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type SortableFieldCardProps = {
  field: IDeclarativeFormField;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (nextField: IDeclarativeFormField) => void;
  onDelete: () => void;
  defaultLocale?: string;
};

function createSectionId(sections: IDeclarativeFormSection[]) {
  const existingIds = new Set(sections.map((section) => section.id).filter(Boolean));
  let index = sections.length + 1;

  while (existingIds.has(`section_${index}`)) {
    index += 1;
  }

  return `section_${index}`;
}

function createFieldId(fields: IDeclarativeFormField[], type: SupportedFieldType) {
  const existingIds = new Set(fields.map((field) => field.id).filter(Boolean));
  let index = fields.length + 1;

  while (existingIds.has(`${type}_${index}`)) {
    index += 1;
  }

  return `${type}_${index}`;
}

function getSortableFieldId(field: IDeclarativeFormField, index: number) {
  return `${field.id ?? "field"}::${index}`;
}

function InlineEditorCard({
  title,
  subtitle,
  icon,
  isExpanded,
  onToggle,
  dragHandle,
  footer,
  children,
  className,
}: InlineEditorCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background transition-colors",
        isExpanded && "border-foreground/15 bg-muted/5",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {dragHandle}

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-accent/30 focus-visible:bg-accent/30"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
            {icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>

          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {isExpanded ? (
        <>
          <div className="border-t border-border px-4 py-3">
            {children}
          </div>
          {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
        </>
      ) : null}
    </div>
  );
}

function AddFieldButton({
  disabled,
  onAddField,
}: {
  disabled: boolean;
  onAddField: (type: SupportedFieldType) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={disabled}
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
              <Button
                key={fieldType}
                type="button"
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-3"
                onClick={() => {
                  onAddField(fieldType);
                  setIsPickerOpen(false);
                }}
              >
                <Icon className="size-4 text-muted-foreground" />
                <span>{getFieldTypeLabel(fieldType)}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableFieldCard({
  field,
  index,
  isExpanded,
  onToggle,
  onChange,
  onDelete,
  defaultLocale,
}: SortableFieldCardProps) {
  const sortableId = getSortableFieldId(field, index);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const fieldType = getEditableFieldType(field);
  const Icon = getFieldTypeIcon(fieldType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "z-10 opacity-90 shadow-sm")}
    >
      <InlineEditorCard
        title={getFieldDisplayLabel(field)}
        subtitle={getFieldTypeLabel(fieldType)}
        icon={<Icon className="size-4" />}
        isExpanded={isExpanded}
        onToggle={onToggle}
        dragHandle={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label={`Reorder ${getFieldDisplayLabel(field)}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </Button>
        }
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onDelete}>
              <Trash2 />
              Delete Field
            </Button>
          </div>
        }
      >
        <FieldProperties
          field={field}
          onChange={onChange}
          defaultLocale={defaultLocale}
        />
      </InlineEditorCard>
    </div>
  );
}

export function FormBuilder({ form, onChange }: FormBuilderProps) {
  const sections = form.sections ?? [];
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(
    sections.length > 0 ? 0 : null,
  );
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(
    sections.length > 0 ? { type: "section" } : null,
  );

  useEffect(() => {
    if (sections.length === 0) {
      if (activeSectionIndex !== null) {
        setActiveSectionIndex(null);
      }

      if (expandedPanel !== null) {
        setExpandedPanel(null);
      }

      return;
    }

    if (activeSectionIndex === null) {
      setActiveSectionIndex(0);
      setExpandedPanel({ type: "section" });
      return;
    }

    if (activeSectionIndex >= sections.length) {
      setActiveSectionIndex(sections.length - 1);
      setExpandedPanel({ type: "section" });
      return;
    }

    const activeFields = sections[activeSectionIndex]?.fields ?? [];

    if (
      expandedPanel?.type === "field" &&
      expandedPanel.index >= activeFields.length
    ) {
      setExpandedPanel({ type: "section" });
    }
  }, [sections, activeSectionIndex, expandedPanel]);

  const activeSection =
    activeSectionIndex !== null ? sections[activeSectionIndex] ?? null : null;
  const activeFields = activeSection?.fields ?? [];
  const sortableFieldIds = activeFields.map((field, index) =>
    getSortableFieldId(field, index),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAddSection = () => {
    const nextSection: IDeclarativeFormSection = {
      id: createSectionId(sections),
      title: "",
      fields: [],
    };
    const nextSections = [...sections, nextSection];

    onChange({
      ...form,
      sections: nextSections,
    });

    setActiveSectionIndex(nextSections.length - 1);
    setExpandedPanel({ type: "section" });
  };

  const handleSelectSection = (index: number) => {
    setActiveSectionIndex(index);
    setExpandedPanel({ type: "section" });
  };

  const handleAddField = (type: SupportedFieldType) => {
    if (activeSectionIndex === null) {
      return;
    }

    const nextField = createDefaultField(type, createFieldId(activeFields, type));

    const nextSections = sections.map((section, index) =>
      index === activeSectionIndex
        ? {
            ...section,
            fields: [...(section.fields ?? []), nextField],
          }
        : section,
    );

    onChange({
      ...form,
      sections: nextSections,
    });

    setExpandedPanel({ type: "field", index: activeFields.length });
  };

  const handleUpdateField = (fieldIndex: number, nextField: IDeclarativeFormField) => {
    if (activeSectionIndex === null) {
      return;
    }

    const nextSections = sections.map((section, sectionIndex) => {
      if (sectionIndex !== activeSectionIndex) {
        return section;
      }

      return {
        ...section,
        fields: (section.fields ?? []).map((field, index) =>
          index === fieldIndex ? nextField : field,
        ),
      };
    });

    onChange({
      ...form,
      sections: nextSections,
    });
  };

  const handleDeleteField = (fieldIndex: number) => {
    if (activeSectionIndex === null) {
      return;
    }

    const nextFieldCount = Math.max(0, activeFields.length - 1);
    const nextSections = sections.map((section, sectionIndex) => {
      if (sectionIndex !== activeSectionIndex) {
        return section;
      }

      return {
        ...section,
        fields: (section.fields ?? []).filter((_, index) => index !== fieldIndex),
      };
    });

    onChange({
      ...form,
      sections: nextSections,
    });

    setExpandedPanel((current) => {
      if (current?.type !== "field") {
        return current;
      }

      if (current.index === fieldIndex) {
        return nextFieldCount > 0
          ? { type: "field", index: Math.min(fieldIndex, nextFieldCount - 1) }
          : { type: "section" };
      }

      if (current.index > fieldIndex) {
        return { type: "field", index: current.index - 1 };
      }

      return current;
    });
  };

  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    if (activeSectionIndex === null || fromIndex === toIndex) {
      return;
    }

    const nextSections = sections.map((section, sectionIndex) => {
      if (sectionIndex !== activeSectionIndex) {
        return section;
      }

      return {
        ...section,
        fields: arrayMove(section.fields ?? [], fromIndex, toIndex),
      };
    });

    onChange({
      ...form,
      sections: nextSections,
    });

    setExpandedPanel((current) => {
      if (current?.type !== "field") {
        return current;
      }

      if (current.index === fromIndex) {
        return { type: "field", index: toIndex };
      }

      if (
        current.index >= Math.min(fromIndex, toIndex) &&
        current.index <= Math.max(fromIndex, toIndex)
      ) {
        return {
          type: "field",
          index: fromIndex < toIndex ? current.index - 1 : current.index + 1,
        };
      }

      return current;
    });
  };

  const handleUpdateSection = (nextSection: IDeclarativeFormSection) => {
    if (activeSectionIndex === null) {
      return;
    }

    const nextSections = sections.map((section, sectionIndex) =>
      sectionIndex === activeSectionIndex ? nextSection : section,
    );

    onChange({
      ...form,
      sections: nextSections,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortableFieldIds.indexOf(String(active.id));
    const newIndex = sortableFieldIds.indexOf(String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      handleReorderFields(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <BuilderSectionTitle>Section</BuilderSectionTitle>
          <Select
            value={activeSectionIndex !== null ? String(activeSectionIndex) : undefined}
            onValueChange={(value) => handleSelectSection(Number(value))}
            disabled={sections.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section, index) => (
                <SelectItem key={section.id ?? `section-${index}`} value={String(index)}>
                  {getSectionDisplayTitle(section.title)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleAddSection}>
          <Plus />
          Add Section
        </Button>
      </div>

      {!activeSection ? (
        <BuilderInset variant="dashed" className="px-4 py-6">
          No sections yet. Add a section to start building your form.
        </BuilderInset>
      ) : (
        <div className="space-y-3">
          <InlineEditorCard
            title="Section Settings"
            subtitle="Navigation and properties"
            icon={<Settings className="size-4" />}
            isExpanded={expandedPanel?.type === "section"}
            onToggle={() =>
              setExpandedPanel((current) =>
                current?.type === "section" ? null : { type: "section" },
              )
            }
          >
            <SectionProperties
              section={activeSection}
              allSections={sections}
              defaultLocale={form.locale}
              onChange={handleUpdateSection}
            />
          </InlineEditorCard>

          {activeFields.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableFieldIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {activeFields.map((field, index) => (
                    <SortableFieldCard
                      key={getSortableFieldId(field, index)}
                      field={field}
                      index={index}
                      defaultLocale={form.locale}
                      isExpanded={
                        expandedPanel?.type === "field" && expandedPanel.index === index
                      }
                      onToggle={() =>
                        setExpandedPanel((current) =>
                          current?.type === "field" && current.index === index
                            ? null
                            : { type: "field", index },
                        )
                      }
                      onChange={(nextField) => handleUpdateField(index, nextField)}
                      onDelete={() => handleDeleteField(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <BuilderInset variant="dashed" className="px-4 py-6">
              No fields in this section yet.
            </BuilderInset>
          )}

          <AddFieldButton disabled={false} onAddField={handleAddField} />
        </div>
      )}
    </div>
  );
}
