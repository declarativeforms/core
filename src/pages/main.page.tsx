import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

import { BasePage } from "./base.page";
import {
  DeclarativeForm,
  HeroSection,
  type IDeclarativeForm,
} from "@/components";

const RESERVED_QUERY_KEYS = new Set(["connection_id", "submission_id", "step"]);

export function MainPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const connectionId = searchParams.get("connection_id");
  const submissionId = searchParams.get("submission_id");
  const stepParam = searchParams.get("step");

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

      return (await response.json()) as IDeclarativeForm;
    },
  });

  const data = useMemo<FieldValues>(() => {
    const initialData: FieldValues = {};

    for (const [key, value] of searchParams.entries()) {
      if (RESERVED_QUERY_KEYS.has(key)) {
        continue;
      }

      initialData[key] = value;
    }

    return initialData;
  }, [searchParams]);

  const updateProgressQuery = useCallback(
    (progress: { submissionId: string | null; step: string }) => {
      const nextParams = new URLSearchParams(searchParams);

      if (progress.submissionId) {
        nextParams.set("submission_id", progress.submissionId);
      } else {
        nextParams.delete("submission_id");
      }

      if (progress.step) {
        nextParams.set("step", progress.step);
      } else {
        nextParams.delete("step");
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

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

  const initialSectionId =
    stepParam && form.sections.some((section) => section.id === stepParam)
      ? stepParam
      : form.sections[0].id;

  return (
    <BasePage title={form.title} description={form.description}>
      <DeclarativeForm
        form={form}
        initialData={data}
        initialSectionId={initialSectionId}
        submissionId={submissionId}
        onProgress={({ step, submissionId: nextSubmissionId }) => {
          updateProgressQuery({
            step,
            submissionId: nextSubmissionId,
          });
        }}
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
            return result.id;
          }
        }}
      />
    </BasePage>
  );
}
