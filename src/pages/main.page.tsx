import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

import { BasePage } from "./base.page";
import {
  DeclarativeForm,
  HeroSection,
  type IDeclarativeForm,
} from "@/components";
import { resolveLocalizedText } from "@/components/declarative-form/localized-content";
import { useI18n } from "@/i18n";
import { getBackendUrl } from "@/lib/api";

const RESERVED_QUERY_KEYS = new Set([
  "connection_id",
  "lang",
  "submission_id",
  "step",
]);

export function MainPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const connectionId = searchParams.get("connection_id");
  const submissionId = searchParams.get("submission_id");
  const stepParam = searchParams.get("step");
  const langParam = searchParams.get("lang");

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
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && params.file
        ? getBackendUrl(`forms/${params.owner}/${params.repository}/${params.file}`)
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

  useEffect(() => {
    if (!form?.locale || langParam === form.locale) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("lang", form.locale);
    setSearchParams(nextParams, { replace: true });
  }, [form?.locale, langParam, searchParams, setSearchParams]);

  if (error) {
    return (
      <HeroSection
        title={t("main.form_not_found.title")}
        description={t("main.form_not_found.description")}
      />
    );
  }

  if (!form) {
    return null;
  }

  if (form.start_date && new Date(form.start_date) > new Date()) {
    return (
      <HeroSection
        title={t("main.form_not_yet_open.title")}
        description={t("main.form_not_yet_open.description")}
      />
    );
  }

  if (form.end_date && new Date(form.end_date) < new Date()) {
    return (
      <HeroSection
        title={t("main.form_closed.title")}
        description={t("main.form_closed.description")}
      />
    );
  }

  const initialSectionId =
    stepParam && form.sections.some((section) => section.id === stepParam)
      ? stepParam
      : form.sections[0].id;

  const resolvedTitle = resolveLocalizedText(form.title, locale);
  const resolvedDescription = form.description
    ? resolveLocalizedText(form.description, locale)
    : undefined;

  return (
    <BasePage title={resolvedTitle} description={resolvedDescription}>
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
            getBackendUrl(`forms/${form.id || ""}/submissions`)
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
