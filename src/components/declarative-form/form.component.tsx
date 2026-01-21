import { useEffect, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "./types";

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  initialData: FieldValues;
}) {
  const navigate = useNavigate();

  const [data, setData] = useState<FieldValues>(props.initialData);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    props.form.sections[0].id
  );

  useEffect(() => {
    if (activeSectionId === "done") {
      navigate("/thank-you");
    }
  }, [activeSectionId, navigate]);

  const activeSection = props.form.sections.find(
    (section) => section.id === activeSectionId
  );

  if (!activeSection) {
    return null;
  }

  return (
    <DeclarativeFormSection
      key={activeSectionId}
      data={data}
      section={activeSection}
      onSubmit={(sectionData: FieldValues) => {
        const newData = { ...data, ...sectionData };
        setData(newData);

        const currentSection = props.form.sections.find(
          (section) => section.id === activeSectionId
        );

        if (!currentSection) {
          return;
        }

        let nextSectionId = "done";
        if (typeof currentSection.next === "string") {
          nextSectionId = currentSection.next;
        } else {
          for (const rule of currentSection.next) {
            if ("when" in rule) {
              try {
                const condition = new Function("data", `return ${rule.when}`);
                if (condition(newData)) {
                  nextSectionId = rule.go;
                  break;
                }
              } catch (e) {
                console.error("Error executing when condition:", e);
              }
            } else if ("else" in rule) {
              nextSectionId = rule.else;
              break;
            }
          }
        }
        setActiveSectionId(nextSectionId);
      }}
    />
  );
}
