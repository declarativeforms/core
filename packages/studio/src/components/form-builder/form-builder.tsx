import { useEffect, useState } from "react";

import type {
  IDeclarativeForm,
  IDeclarativeFormField,
  IDeclarativeFormSection,
} from "@/lib/declarative-form-types";
import { FieldList } from "./field-list";
import { FieldProperties } from "./field-properties";
import { SectionList } from "./section-list";
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
  const sections = form.sections ?? [];
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(
    sections.length > 0 ? 0 : null,
  );
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    sections[0]?.fields && sections[0].fields.length > 0 ? 0 : null,
  );

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

    const nextSectionIndex =
      activeSectionIndex !== null && activeSectionIndex < sections.length
        ? activeSectionIndex
        : 0;

    if (nextSectionIndex !== activeSectionIndex) {
      setActiveSectionIndex(nextSectionIndex);
      return;
    }

    const fields = sections[nextSectionIndex]?.fields ?? [];

    if (fields.length === 0) {
      if (selectedFieldIndex !== null) {
        setSelectedFieldIndex(null);
      }

      return;
    }

    const nextFieldIndex =
      selectedFieldIndex !== null && selectedFieldIndex < fields.length
        ? selectedFieldIndex
        : 0;

    if (nextFieldIndex !== selectedFieldIndex) {
      setSelectedFieldIndex(nextFieldIndex);
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

  const handleUpdateSectionTitle = (index: number, title: string) => {
    const nextSections = sections.map((section, sectionIndex) =>
      sectionIndex === index
        ? {
            ...section,
            title,
          }
        : section,
    );

    onChange({
      ...form,
      sections: nextSections,
    });
  };

  const handleSelectSection = (index: number) => {
    setActiveSectionIndex(index);

    const nextFields = sections[index]?.fields ?? [];
    setSelectedFieldIndex(nextFields.length > 0 ? 0 : null);
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

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex min-h-0 w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-muted/10">
        <div className="min-h-0 max-h-[40%] shrink overflow-hidden">
          <SectionList
            sections={sections}
            activeSectionIndex={activeSectionIndex}
            onSelectSection={handleSelectSection}
            onUpdateSectionTitle={handleUpdateSectionTitle}
            onAddSection={handleAddSection}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden border-t border-border">
          <FieldList
            fields={activeFields}
            selectedFieldIndex={selectedFieldIndex}
            canAddField={activeSectionIndex !== null}
            onSelectField={setSelectedFieldIndex}
            onAddField={handleAddField}
          />
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
        <FieldProperties field={selectedField} onChange={handleUpdateField} />
      </div>
    </div>
  );
}
