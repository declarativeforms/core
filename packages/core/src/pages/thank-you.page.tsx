import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { HeroSection, type IDeclarativeForm } from "@/components";
import { compile } from "@declarativeforms/runtime";
import { interpolateTemplate } from "@declarativeforms/common";
import { useI18n } from "@/i18n";
import { getBackendUrl } from "@/lib/api";

type SubmissionPayload = {
  data: Record<string, unknown>;
};

export function ThankYouPage() {
  const { locale, t } = useI18n();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const submissionId = searchParams.get("submission_id");
  const langParam = searchParams.get("lang");

  const { data: form, isLoading: isFormLoading } = useQuery({
    queryKey: ["form", params.id],
    queryFn: async () => {
      const url = getBackendUrl(`forms/${params.id}`);
      const response = await fetch(url);

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
    enabled: !!params.id,
  });

  const formId = form?.id ?? params.id;

  const { data: submission } = useQuery({
    queryKey: ["submission", formId, submissionId],
    queryFn: async () => {
      if (!formId) {
        return null;
      }

      const response = await fetch(
        getBackendUrl(`forms/${formId}/submissions/${submissionId}`),
      );
      if (!response.ok) return null;
      return response.json() as Promise<SubmissionPayload>;
    },
    enabled: !!formId && !!submissionId,
  });

  useEffect(() => {
    document.title = t("thank_you.page_title");
  }, [t]);

  useEffect(() => {
    if (!form?.locale || langParam === form.locale) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("lang", form.locale);
    setSearchParams(nextParams, { replace: true });
  }, [form?.locale, langParam, searchParams, setSearchParams]);

  if (isFormLoading) {
    return null;
  }

  const submissionData = submission?.data ?? {};
  const completion = form
    ? compile(form, locale, submissionData, "").completion
    : undefined;

  if (completion) {
    return (
      <HeroSection
        title={interpolateTemplate(
          completion.title ?? t("thank_you.default_title"),
          submissionData,
        )}
        description={
          completion.message
            ? interpolateTemplate(completion.message, submissionData)
            : t("thank_you.default_description")
        }
        buttonLabel={completion.button?.label}
        buttonHref={
          completion.button?.url
            ? interpolateTemplate(completion.button.url, submissionData)
            : undefined
        }
        theme={form?.theme}
      />
    );
  }

  return (
    <HeroSection
      title={t("thank_you.default_title")}
      description={t("thank_you.default_description")}
      theme={form?.theme}
    />
  );
}
