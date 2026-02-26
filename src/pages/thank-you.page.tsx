import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { HeroSection, type IDeclarativeForm } from "@/components";
import { interpolateTemplate } from "@/components/declarative-form/form-helpers";
import { resolveCompletionContent } from "@/components/declarative-form/localized-content";
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

  const { data: form } = useQuery({
    queryKey: ["form", params.id, params.owner, params.repository, params.file],
    queryFn: async () => {
      const url = params.id
        ? getBackendUrl(`forms/${params.id}`)
        : params.owner && params.repository && params.file
        ? getBackendUrl(`forms/${params.owner}/${params.repository}/${params.file}`)
        : null;

      if (!url) {
        return null;
      }

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
    enabled: !!(
      params.id ||
      (params.owner && params.repository && params.file)
    ),
  });

  const { data: submission } = useQuery({
    queryKey: ["submission", form?.id, submissionId],
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`forms/${form!.id}/submissions/${submissionId}`)
      );
      if (!response.ok) return null;
      return response.json() as Promise<SubmissionPayload>;
    },
    enabled: !!form?.id && !!submissionId,
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

  const completion = resolveCompletionContent(form?.completion, locale);
  const submissionData = submission?.data ?? {};

  if (completion) {
    return (
      <HeroSection
        title={interpolateTemplate(
          completion.title ?? t("thank_you.default_title"),
          submissionData
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
      />
    );
  }

  return (
    <HeroSection
      title={t("thank_you.default_title")}
      description={t("thank_you.default_description")}
    />
  );
}
