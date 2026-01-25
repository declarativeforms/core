import { useEffect, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "./types";

export function DeclarativeForm(props: {
  form: IDeclarativeForm;
  initialData: FieldValues;
  onSubmit: (data: FieldValues, isPartial: boolean) => Promise<void>;
}) {
  const navigate = useNavigate();

  const [data, setData] = useState<FieldValues>(props.initialData);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    props.form.sections[0].id
  );

  useEffect(() => {
    window.scrollTo(0, 0);

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
      onSubmit={async (x: FieldValues) => {
        const result = { ...data, ...x };
        setData(result);

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
              const condition = new Function("data", `return ${rule.when}`);
              if (condition(result)) {
                nextSectionId = rule.go;

                break;
              }
            } else if ("else" in rule) {
              nextSectionId = rule.else;
              break;
            }
          }
        }

        if (nextSectionId.startsWith("https://")) {
          await props.onSubmit(result, false);

          window.location.href = nextSectionId;

          return;
        }

        if (nextSectionId === "done") {
          await props.onSubmit(result, false);
        } else {
          await props.onSubmit(result, true);
        }

        setActiveSectionId(nextSectionId);
      }}
    />
  );
}
