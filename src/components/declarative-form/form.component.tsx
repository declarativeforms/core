import yaml from "js-yaml";
import { useEffect, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DeclarativeFormSection } from "./section.component";
import type { IDeclarativeForm } from "./types";

export function DeclarativeForm(props: { initialData: FieldValues }) {
  const navigate = useNavigate();

  const { data: formDef } = useQuery({
    queryKey: ["form"],
    queryFn: async () => {
      const response = await fetch("/form.yaml");

      return yaml.load(await response.text()) as IDeclarativeForm;
    },
  });

  const [data, setData] = useState<FieldValues>(props.initialData);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (formDef?.sections.length && !activeSectionId) {
      setActiveSectionId(formDef.sections[0].id);
    }
  }, [activeSectionId, formDef]);

  useEffect(() => {
    if (activeSectionId === "done") {
      navigate("/thank-you");
    }
  }, [activeSectionId, navigate]);

  if (!formDef) {
    return null;
  }

  const activeSection = formDef.sections.find(
    (section) => section.id === activeSectionId
  );

  if (!activeSection) {
    return null;
  }

  return (
    <div className="flex h-lvh items-center justify-center max-w-lg mx-auto px-4">
      <div className="w-full">
        <DeclarativeFormSection
          key={activeSectionId}
          data={data}
          section={activeSection}
          onSubmit={(sectionData: FieldValues) => {
            const newData = { ...data, ...sectionData };
            setData(newData);

            const currentSection = formDef.sections.find(
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
                    const condition = new Function(
                      "data",
                      `return ${rule.when}`
                    );
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
      </div>
    </div>
  );
}
