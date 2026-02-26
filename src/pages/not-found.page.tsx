import { HeroSection } from "@/components/declarative-form/hero-section.component";
import { useI18n } from "@/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <HeroSection
      title={t("main.form_not_found.title")}
      description={t("main.form_not_found.description")}
    />
  );
}
