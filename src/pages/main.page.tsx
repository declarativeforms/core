import yaml from "js-yaml";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DeclarativeForm, type IDeclarativeForm } from "@/components";
import { BasePage } from "./base.page";

export function MainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { data: form } = useQuery({
    queryKey: ["form", params.id, params.owner, params.repository, params.file],
    queryFn: async () => {
      const response = await fetch(
        params.id
          ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.id}`
          : params.owner && params.repository && params.file
          ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.owner}/${params.repository}/${params.file}`
          : "/default.yaml"
      );

      return yaml.load(await response.text()) as IDeclarativeForm;
    },
  });

  const [data] = useState<FieldValues>(() => {
    const initialData: FieldValues = {};

    for (const [key, value] of searchParams.entries()) {
      initialData[key] = value;
    }

    return initialData;
  });

  if (!form) {
    return null;
  }

  return (
    <BasePage title={form.title} description={form.description}>
      <DeclarativeForm
        form={form}
        initialData={data}
        onSubmit={async (data, isPartial) => {
          const url = new URL(
            `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${
              form.id || ""
            }/submissions`
          );

          if (isPartial) {
            url.searchParams.set("partial", "true");
          }

          if (submissionId) {
            url.searchParams.set("id", submissionId);
          }

          const response = await fetch(url.toString(), {
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          const result = await response.json();
          if (result && result.id) {
            setSubmissionId(result.id);
          }
        }}
      />
    </BasePage>
  );
}
