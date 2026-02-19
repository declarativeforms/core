import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { HeroSection, type IDeclarativeForm } from "@/components";
import { interpolateTemplate } from "@/components/declarative-form/form-helpers";

export function ThankYouPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("submission_id");

  const { data: form } = useQuery({
    queryKey: ["form", params.id, params.owner, params.repository, params.file],
    queryFn: async () => {
      const url = params.id
        ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.id}`
        : params.owner && params.repository && params.file
        ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.owner}/${params.repository}/${params.file}`
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
        `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${
          form!.id
        }/submissions/${submissionId}`
      );
      if (!response.ok) return null;
      return response.json() as Promise<{ data: Record<string, any> }>;
    },
    enabled: !!form?.id && !!submissionId,
  });

  useEffect(() => {
    document.title = "Thank You — Declarative Forms";
  }, []);

  const completion = form?.completion;
  const submissionData = submission?.data ?? {};

  if (completion) {
    return (
      <HeroSection
        title={interpolateTemplate(
          completion.title ?? "Thank You!",
          submissionData
        )}
        description={
          completion.message
            ? interpolateTemplate(completion.message, submissionData)
            : "Your submission has been received."
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
      title="Thank You!"
      description="Your submission has been received."
    />
  );
}
