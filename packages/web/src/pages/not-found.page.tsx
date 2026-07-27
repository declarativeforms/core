import { HeroSection } from '@declarativeforms/react';
import { useI18n } from '@declarativeforms/react';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <HeroSection
      title={t('main.form_not_found.title')}
      description={t('main.form_not_found.description')}
    />
  );
}
