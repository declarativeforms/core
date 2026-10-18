'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { copyTextToClipboard } from '@/lib/clipboard';
import { readFormScrollSnapshot } from '@/lib/scroll-diagnostics';

const MAX_TRACE_ENTRIES = 300;

export function FormScrollDiagnostics(props: {
  mode: '1' | 'no_focus' | 'force_scroll';
}): React.JSX.Element | null {
  const traceRef = useRef<Array<string>>([]);
  const [stopped, setStopped] = useState(false);
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copying' | 'copied' | 'manual'
  >('idle');
  const [report, setReport] = useState('');

  useEffect(() => {
    if (stopped) {
      return;
    }

    const started = performance.now();
    const controller = new AbortController();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const originalScrollTo = window.scrollTo;
    const originalFocus = HTMLElement.prototype.focus;
    let previousForm = document.querySelector('form');

    function record(event: string): void {
      traceRef.current.push(
        `${Math.round(performance.now() - started)}ms ${event}`,
      );
      if (traceRef.current.length > MAX_TRACE_ENTRIES) {
        traceRef.current.shift();
      }
    }

    function sample(event: string): void {
      for (const delay of [0, 100, 500, 1500]) {
        const timer = setTimeout(() => {
          timers.delete(timer);
          record(`${event} +${delay}ms ${readFormScrollSnapshot()}`);
        }, delay);
        timers.add(timer);
      }
    }

    function traceScrollTo(
      ...coordinates: [options?: ScrollToOptions] | [x: number, y: number]
    ): void {
      const options =
        typeof coordinates[0] === 'number'
          ? { left: coordinates[0], top: coordinates[1] }
          : coordinates[0];
      record(
        `scrollTo ${JSON.stringify(coordinates)} from y=${window.scrollY}`,
      );
      if (
        props.mode === 'force_scroll' &&
        options?.top === 0 &&
        (options.left ?? window.scrollX) === 0
      ) {
        record('forced scroll request top=-1');
        Reflect.apply(originalScrollTo, window, [{ ...options, top: -1 }]);
      } else {
        Reflect.apply(originalScrollTo, window, coordinates);
      }
      sample('scrollTo');
    }

    function traceFocus(this: HTMLElement, options?: FocusOptions): void {
      if (props.mode === 'no_focus' && this.tagName === 'FORM') {
        record('focus skipped FORM');

        return;
      }

      record(
        `focus ${this.tagName} preventScroll=${options?.preventScroll ?? false}`,
      );
      Reflect.apply(originalFocus, this, [options]);
      sample('focus');
    }

    window.scrollTo = traceScrollTo;
    HTMLElement.prototype.focus = traceFocus;
    document.addEventListener('submit', () => sample('submit'), {
      capture: true,
      passive: true,
      signal: controller.signal,
    });
    for (const event of ['scroll', 'resize', 'scrollend']) {
      window.addEventListener(
        event,
        () => record(`window.${event} y=${window.scrollY}`),
        {
          passive: true,
          signal: controller.signal,
        },
      );
      window.visualViewport?.addEventListener(
        event,
        () => {
          record(
            `viewport.${event} pageTop=${window.visualViewport?.pageTop} offsetTop=${window.visualViewport?.offsetTop}`,
          );
        },
        { passive: true, signal: controller.signal },
      );
    }
    const observer = new MutationObserver(() => {
      const form = document.querySelector('form');
      if (form !== previousForm) {
        previousForm = form;
        sample('section mounted');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    sample('installed');

    return () => {
      controller.abort();
      observer.disconnect();
      for (const timer of timers) {
        clearTimeout(timer);
      }
      if (window.scrollTo === traceScrollTo) {
        window.scrollTo = originalScrollTo;
      }
      if (HTMLElement.prototype.focus === traceFocus) {
        HTMLElement.prototype.focus = originalFocus;
      }
    };
  }, [stopped, props.mode]);

  async function copyTrace(): Promise<void> {
    const trace = [
      navigator.userAgent,
      `section focus: ${props.mode === 'no_focus' ? 'disabled' : 'enabled'}`,
      `scroll request: ${props.mode === 'force_scroll' ? 'forced' : 'standard'}`,
      ...traceRef.current,
      `current ${readFormScrollSnapshot()}`,
    ].join('\n');
    setReport(trace);
    setCopyStatus('copying');

    const copied = await copyTextToClipboard(trace);
    setCopyStatus(copied ? 'copied' : 'manual');
  }

  function scrollToPageTop(): void {
    traceRef.current = [
      ...traceRef.current,
      `manual page top ${readFormScrollSnapshot()}`,
    ].slice(-MAX_TRACE_ENTRIES);
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  }

  function scrollToSectionHeading(): void {
    const headingId = document
      .querySelector('form')
      ?.getAttribute('aria-labelledby');
    const heading = headingId ? document.getElementById(headingId) : null;

    traceRef.current = [
      ...traceRef.current,
      `manual section heading ${readFormScrollSnapshot()}`,
    ].slice(-MAX_TRACE_ENTRIES);
    heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  if (stopped) {
    return null;
  }

  return (
    <aside
      aria-label="Scroll diagnostics"
      className="fixed right-2 bottom-2 z-[100] max-w-[calc(100vw-1rem)] rounded-lg border bg-background p-2 shadow-md"
    >
      {props.mode === 'no_focus' ? (
        <p className="text-sm">Section focus disabled</p>
      ) : null}
      {props.mode === 'force_scroll' ? (
        <p className="text-sm">Forced scroll request</p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={copyStatus === 'copying'}
          onClick={() => void copyTrace()}
        >
          Copy scroll trace
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setStopped(true)}
        >
          Stop
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={scrollToPageTop}
        >
          Page top
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={scrollToSectionHeading}
        >
          Section heading
        </Button>
      </div>
      <p role="status" className="text-sm">
        {copyStatus === 'copying'
          ? 'Copying…'
          : copyStatus === 'copied'
            ? 'Copied'
            : copyStatus === 'manual'
              ? 'Select the trace below and choose Copy.'
              : ''}
      </p>
      {report ? (
        <textarea
          aria-label="Scroll trace — select and copy"
          readOnly
          value={report}
          className="mt-2 h-32 w-full text-xs"
        />
      ) : null}
    </aside>
  );
}
