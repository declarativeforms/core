'use client';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { HtmlText } from '@/components/declarative-form/supporting';

export function DeclarativeFormHeading(props: {
  title?: string;
  description?: string;
  titleId?: string;
}): React.JSX.Element | null {
  if (!props.title && !props.description) {
    return null;
  }

  return (
    <CardHeader className="px-6 pb-6 border-b border-border">
      {props.title ? (
        <CardTitle id={props.titleId} className="text-2xl/8 font-semibold">
          <HtmlText html={props.title} />
        </CardTitle>
      ) : null}
      {props.description ? (
        <CardDescription className="text-sm/5 text-muted-foreground">
          <HtmlText html={props.description} />
        </CardDescription>
      ) : null}
    </CardHeader>
  );
}
