'use client';
import { CardContent, Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';

export function SectionLoading(): React.JSX.Element {
  const i18n = useI18n();

  return (
    <CardContent role="status" aria-live="polite" className="px-6">
      <span className="sr-only">{i18n.t('section.loading')}</span>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-7 w-3/5 motion-reduce:animate-none" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
          <Skeleton className="h-10 w-full motion-reduce:animate-none" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/5 motion-reduce:animate-none" />
          <Skeleton className="h-24 w-full motion-reduce:animate-none" />
        </div>
      </div>
    </CardContent>
  );
}
