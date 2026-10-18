'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { readFormScrollSnapshot } from '@/lib/scroll-diagnostics';

const MAX_TRACE_ENTRIES = 300;

export function FormScrollDiagnostics(): React.JSX.Element | null {
  const traceRef = useRef<Array<string>>([]);
  const [stopped, setStopped] = useState(false);
  const [copied, setCopied] = useState(false);
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
      record(`scrollTo ${JSON.stringify(coordinates)}`);
      Reflect.apply(originalScrollTo, window, coordinates);
      sample('scrollTo');
    }

    function traceFocus(this: HTMLElement, options?: FocusOptions): void {
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
  }, [stopped]);

  async function copyTrace(): Promise<void> {
    const trace = [
      navigator.userAgent,
      ...traceRef.current,
      `current ${readFormScrollSnapshot()}`,
    ].join('\n');
    setCopied(false);
    setReport('');

    try {
      await navigator.clipboard.writeText(trace);
      setCopied(true);
    } catch {
      setReport(trace);
    }
  }

  if (stopped) {
    return null;
  }

  return (
    <aside
      aria-label="Scroll diagnostics"
      className="fixed right-2 top-2 z-[100] max-w-[calc(100vw-1rem)] rounded-lg border bg-background p-2 shadow-md"
    >
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => void copyTrace()}>
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
        <span role="status">{copied ? 'Copied' : ''}</span>
      </div>
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
