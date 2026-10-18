'use client';
import { useRef, type ReactElement, type ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { HtmlText } from './html-text';
import { useSelectionViewport } from './use-selection-viewport';

type MobileSelectionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trigger: ReactElement;
  children: ReactNode;
};

function MobileSelectionContent(
  props: Pick<MobileSelectionSheetProps, 'title' | 'children'>,
): React.JSX.Element {
  const i18n = useI18n();
  const viewportStyle = useSelectionViewport();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <SheetContent
      ref={contentRef}
      side="bottom"
      showCloseButton={false}
      aria-describedby={undefined}
      className="form-selection-sheet gap-0 overflow-hidden rounded-t-2xl border-border pb-[env(safe-area-inset-bottom)] motion-reduce:animate-none motion-reduce:transition-none"
      style={viewportStyle}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        const target =
          contentRef.current?.querySelector<HTMLElement>(
            '[data-selection-autofocus]',
          ) ??
          contentRef.current?.querySelector<HTMLElement>(
            '[data-selection-title]',
          );
        target?.focus({ preventScroll: true });
      }}
    >
      <SheetHeader className="shrink-0 flex-row items-center justify-between gap-3 border-b p-4">
        <SheetTitle
          data-selection-title
          tabIndex={-1}
          className="min-w-0 text-lg font-semibold outline-none"
        >
          <HtmlText html={props.title} />
        </SheetTitle>
        <SheetClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label={i18n.t('selection.close')}
          >
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
      </SheetHeader>
      {props.children}
    </SheetContent>
  );
}

export function MobileSelectionSheet(
  props: MobileSelectionSheetProps,
): React.JSX.Element {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetTrigger asChild>{props.trigger}</SheetTrigger>
      {props.open && (
        <MobileSelectionContent title={props.title}>
          {props.children}
        </MobileSelectionContent>
      )}
    </Sheet>
  );
}
