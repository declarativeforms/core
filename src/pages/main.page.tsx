import { useQuery } from "@tanstack/react-query";
import yaml from "js-yaml";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

import { BasePage } from "./base.page";
import {
  DeclarativeForm,
  HeroSection,
  type IDeclarativeForm,
} from "@/components";

export function MainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const connectionId = searchParams.get("connection_id");

  const { data: form, error } = useQuery({
    queryKey: [
      "form",
      params.id,
      params.owner,
      params.repository,
      params.file,
      connectionId,
    ],
    queryFn: async () => {
      const url = params.id
        ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.id}`
        : params.owner && params.repository && params.file
        ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.owner}/${params.repository}/${params.file}`
        : "/default.yaml";

      const fetchUrl = new URL(url, window.location.origin);
      if (connectionId) {
        fetchUrl.searchParams.set("connection_id", connectionId);
      }

      const response = await fetch(fetchUrl.toString());

      if (response.status === 403) {
        const state = encodeURIComponent(window.location.pathname);
        window.location.href = `${window.location.origin}/oauth/github?state=${state}`;
        return;
      }

      if (!response.ok) {
        throw new Error(`Form not found: ${response.status}`);
      }

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

  if (error) {
    return (
      <HeroSection
        title="Form Not Found"
        description="The form you're looking for doesn't exist or has been removed."
      />
    );
  }

  if (!form) {
    return null;
  }

  if (form.end_date && new Date(form.end_date) < new Date()) {
    return (
      <HeroSection
        title="Form Closed"
        description=" This form is no longer accepting submissions."
      />
    );
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
