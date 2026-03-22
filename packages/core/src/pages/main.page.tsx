import { useQuery } from "@tanstack/react-query";
import mixpanel from "mixpanel-browser";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { FieldValues } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BasePage } from "./base.page";
import {
  DeclarativeForm,
  HeroSection,
  type IDeclarativeForm,
} from "@/components";
import { resolveLocalizedText } from "@/components/declarative-form/runtime/localization/text";
import type { FormEffect } from "@/components/declarative-form/runtime/types";
import { useI18n } from "@/i18n";
import { getBackendUrl } from "@/lib/api";

const RESERVED_QUERY_KEYS = new Set([
  "connection_id",
  "embed",
  "lang",
  "submission_id",
  "step",
]);

export function MainPage() {
  const navigate = useNavigate();

  const { locale, t, withLang } = useI18n();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const slugPath = params["*"];
  const isSlugRoute = !!(params.owner && params.repository && slugPath);

  const connectionId = searchParams.get("connection_id");
  const embed = searchParams.get("embed") === "true";
  const submissionId = searchParams.get("submission_id");
  const stepParam = searchParams.get("step");
  const langParam = searchParams.get("lang");

  const submissionIdRef = useRef(submissionId);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  const { data: form, error } = useQuery({
    queryKey: [
      "form",
      params.id,
      params.owner,
      params.repository,
      slugPath,
      connectionId,
    ],
    queryFn: async () => {
      const url = params.id
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && slugPath
          ? getBackendUrl(
              `forms/${params.owner}/${params.repository}/${slugPath}`,
            )
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

  const formId = form?.id ?? params.id ?? "";

  useEffect(() => {
    if (!isSlugRoute || !form?.id) return;

    // Redirect to ID path, preserving all query params
    navigate(`/${form.id}?${searchParams.toString()}`, { replace: true });
  }, [isSlugRoute, form?.id, form, connectionId, navigate, searchParams]);

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
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!form?.locale || langParam === form.locale) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("lang", form.locale);
    setSearchParams(nextParams, { replace: true });
  }, [form?.locale, langParam, searchParams, setSearchParams]);

  useEffect(() => {
    if (form?.measurements?.mixpanel) {
      mixpanel.init(form.measurements.mixpanel, {
        api_host: "https://api-eu.mixpanel.com",
      });

      mixpanel.track("page_view", {
        form_id: formId || undefined,
      });
    }
  }, [form?.measurements?.mixpanel, formId]);

  const submitToBackend = useCallback(
    async (formData: Record<string, unknown>, isPartial: boolean) => {
      if (!form) return;

      const submitFormId = form.id ?? params.id;
      if (!submitFormId) {
        return;
      }

      const url = new URL(getBackendUrl(`forms/${submitFormId}/submissions`));

      if (isPartial) {
        url.searchParams.set("partial", "true");
      }

      const currentSubmissionId = submissionIdRef.current;
      if (currentSubmissionId) {
        url.searchParams.set("id", currentSubmissionId);
      }

      const response = await fetch(url.toString(), {
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const result = await response.json();
      return result?.id as string | undefined;
    },
    [form, params.id],
  );

  const handleEffect = useCallback(
    async (effect: FormEffect, state: { data: Record<string, unknown>; activeSectionId: string }) => {
      if (form?.measurements?.mixpanel) {
        mixpanel.track("section_completed", {
          form_id: formId || undefined,
        });
      }

      switch (effect.type) {
        case "submit": {
          const id = await submitToBackend(state.data, effect.isPartial);
          updateProgressQuery({
            submissionId: id ?? submissionIdRef.current,
            step: state.activeSectionId,
          });
          break;
        }

        case "complete": {
          const id = await submitToBackend(state.data, false);
          const finalSubmissionId = id ?? submissionIdRef.current;
          updateProgressQuery({
            submissionId: finalSubmissionId,
            step: "done",
          });
          navigate(
            withLang(
              finalSubmissionId
                ? `thank-you?submission_id=${finalSubmissionId}`
                : "thank-you",
            ),
          );
          break;
        }

        case "redirect": {
          const id = await submitToBackend(state.data, false);
          updateProgressQuery({
            submissionId: id ?? submissionIdRef.current,
            step: "done",
          });
          window.location.href = effect.url;
          break;
        }
      }
    },
    [form, formId, submitToBackend, updateProgressQuery, navigate, withLang],
  );

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
        theme={form.theme}
      />
    );
  }

  if (form.end_date && new Date(form.end_date) < new Date()) {
    return (
      <HeroSection
        title={t("main.form_closed.title")}
        description={t("main.form_closed.description")}
        theme={form.theme}
      />
    );
  }

  const initialSectionId =
    stepParam && (form.sections ?? []).some((section) => section.id === stepParam)
      ? stepParam
      : form.sections?.[0]?.id;

  const resolvedTitle =
    resolveLocalizedText(form.title, locale) || form.id || params.id || "";
  const resolvedDescription = form.description
    ? resolveLocalizedText(form.description, locale)
    : undefined;

  return (
    <BasePage title={resolvedTitle} description={resolvedDescription} theme={form.theme} embed={embed}>
      <DeclarativeForm
        form={form}
        locale={locale}
        initialData={data}
        initialSectionId={initialSectionId}
        onEffect={handleEffect}
      />
    </BasePage>
  );
}
