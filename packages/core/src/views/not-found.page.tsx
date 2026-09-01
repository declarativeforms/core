'use client';

import { HeroSection } from '@/components/declarative-form/scaffolding/hero-section.component';
import { useI18n } from '@/i18n';

export function NotFoundPage() {
  const i18n = useI18n();

  return (
    <HeroSection
      title={i18n.t('main.form_not_found.title')}
      description={i18n.t('main.form_not_found.description')}
    />
  );
}
