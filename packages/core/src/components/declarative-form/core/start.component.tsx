'use client';
import type { IRenderableStart } from '@declarativeforms/engine';
import { Button, CardContent } from '@/components/ui';
import { HtmlText } from '@/components/declarative-form/supporting';
import { useI18n } from '@/i18n';
import { DeclarativeFormHeading } from './heading.component';

export function DeclarativeFormStart(props: {
  start: IRenderableStart;
  onBegin: () => void;
}) {
  const i18n = useI18n();

  return (
    <>
      <DeclarativeFormHeading
        title={props.start.title}
        description={props.start.description}
      />

      <CardContent className="px-6">
        <div className="mt-2 flex justify-end">
          <Button type="button" onClick={props.onBegin}>
            {props.start.button ? (
              <HtmlText html={props.start.button} />
            ) : (
              i18n.t('start.button')
            )}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
