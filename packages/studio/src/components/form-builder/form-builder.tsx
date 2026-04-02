import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { Button } from "@/components/ui";
import { useIsMobile } from "@/hooks";
import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormSection,
} from "@/lib/declarative-form-types";
import { FieldList } from "./field-list";
import { FieldProperties } from "./field-properties";
import { SectionList } from "./section-list";
import { SectionProperties } from "./section-properties";
import { createDefaultField, type SupportedFieldType } from "./shared";

type FormBuilderProps = {
  form: IDeclarativeForm;
  onChange: (nextForm: IDeclarativeForm) => void;
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

export function FormBuilder({ form, onChange }: FormBuilderProps) {
  const isMobile = useIsMobile();
  const sections = form.sections ?? [];
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(
    sections.length > 0 ? 0 : null,
  );
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    sections[0]?.fields && sections[0].fields.length > 0 ? 0 : null,
  );
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    if (!isMobile) {
      setMobileView("list");
    }
  }, [isMobile]);

  useEffect(() => {
    if (sections.length === 0) {
      if (activeSectionIndex !== null) {
        setActiveSectionIndex(null);
      }

      if (selectedFieldIndex !== null) {
        setSelectedFieldIndex(null);
      }

      return;
    }

    if (activeSectionIndex === null) {
      setActiveSectionIndex(0);
      return;
    }

    if (activeSectionIndex >= sections.length) {
      setActiveSectionIndex(sections.length - 1);
      return;
    }

    const fields = sections[activeSectionIndex]?.fields ?? [];

    if (fields.length === 0 && selectedFieldIndex !== null) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex >= fields.length) {
      setSelectedFieldIndex(fields.length - 1);
    }
  }, [sections, activeSectionIndex, selectedFieldIndex]);

  const activeSection =
    activeSectionIndex !== null ? sections[activeSectionIndex] ?? null : null;
  const activeFields = activeSection?.fields ?? [];
  const selectedField =
    selectedFieldIndex !== null ? activeFields[selectedFieldIndex] ?? null : null;

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
    setSelectedFieldIndex(null);
  };

  const handleSelectSection = (index: number) => {
    setActiveSectionIndex(index);

    const nextFields = sections[index]?.fields ?? [];
    setSelectedFieldIndex(nextFields.length > 0 ? 0 : null);

    if (isMobile) {
      setMobileView("list");
    }
  };

  const handleViewSectionSettings = () => {
    setSelectedFieldIndex(null);

    if (isMobile) {
      setMobileView("detail");
    }
  };

  const handleAddField = (type: SupportedFieldType) => {
    if (activeSectionIndex === null) {
      return;
    }

    const nextField = createDefaultField(
      type,
      createFieldId(activeFields, type),
    );

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

    setSelectedFieldIndex(activeFields.length);

    if (isMobile) {
      setMobileView("detail");
    }
  };

  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    if (activeSectionIndex === null) {
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

    if (selectedFieldIndex === fromIndex) {
      setSelectedFieldIndex(toIndex);
    } else if (
      selectedFieldIndex !== null &&
      selectedFieldIndex >= Math.min(fromIndex, toIndex) &&
      selectedFieldIndex <= Math.max(fromIndex, toIndex)
    ) {
      setSelectedFieldIndex(
        fromIndex < toIndex ? selectedFieldIndex - 1 : selectedFieldIndex + 1,
      );
    }
  };

  const handleUpdateField = (nextField: IDeclarativeFormField) => {
    if (activeSectionIndex === null || selectedFieldIndex === null) {
      return;
    }

    const nextSections = sections.map((section, sectionIndex) => {
      if (sectionIndex !== activeSectionIndex) {
        return section;
      }

      return {
        ...section,
        fields: (section.fields ?? []).map((field, fieldIndex) =>
          fieldIndex === selectedFieldIndex ? nextField : field,
        ),
      };
    });

    onChange({
      ...form,
      sections: nextSections,
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

  const handleSelectFieldMobile = (index: number) => {
    setSelectedFieldIndex(index);

    if (isMobile) {
      setMobileView("detail");
    }
  };

  const sectionListNode = (
    <SectionList
      sections={sections}
      activeSectionIndex={activeSectionIndex}
      onSelectSection={handleSelectSection}
      onAddSection={handleAddSection}
    />
  );

  const fieldListNode = (
    <FieldList
      fields={activeFields}
      selectedFieldIndex={selectedFieldIndex}
      canAddField={activeSectionIndex !== null}
      onSelectField={isMobile ? handleSelectFieldMobile : setSelectedFieldIndex}
      onAddField={handleAddField}
      onReorderFields={handleReorderFields}
      onViewSectionSettings={handleViewSectionSettings}
    />
  );

  const detailNode = selectedField ? (
    <FieldProperties field={selectedField} onChange={handleUpdateField} />
  ) : (
    <SectionProperties
      section={activeSection}
      allSections={sections}
      onChange={handleUpdateSection}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background">
        {mobileView === "list" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/10">
            <div className="min-h-0 max-h-[40%] shrink overflow-hidden">
              {sectionListNode}
            </div>
            {fieldListNode && (
              <div className="min-h-0 flex-1 overflow-hidden border-t border-border">
                {fieldListNode}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center border-b border-border px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileView("list")}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {detailNode}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex min-h-0 w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-muted/10">
        <div className="min-h-0 max-h-[40%] shrink overflow-hidden">
          {sectionListNode}
        </div>
        {fieldListNode && (
          <div className="min-h-0 flex-1 overflow-hidden border-t border-border">
            {fieldListNode}
          </div>
        )}
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        {detailNode}
      </div>
    </div>
  );
}
