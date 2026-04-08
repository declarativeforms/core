import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import type { DeclarativeFieldComponentProps } from "../supporting/field-support";
import { useWaitForGlobal } from "../supporting/use-wait-for-global";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileField({
  field: _field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const sitekey = import.meta.env.VITE_TURNSTILE_SITEKEY as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Inject script tag if not already present
  useEffect(() => {
    if (window.turnstile || document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const checkTurnstile = useCallback(() => !!window.turnstile, []);
  const scriptLoaded = useWaitForGlobal(checkTurnstile, { timeout: 10_000 });

  // Stable ref for onChange to avoid re-rendering the widget when RHF updates
  const onChangeRef = useRef(controllerField.onChange);
  useEffect(() => {
    onChangeRef.current = controllerField.onChange;
  });

  // Render the widget once script is ready
  useEffect(() => {
    if (!scriptLoaded || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey,
      callback: (token: string) => onChangeRef.current(token),
      "expired-callback": () => onChangeRef.current(""),
      "error-callback": () => onChangeRef.current(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, sitekey]);

  return (
    <div>
        {!scriptLoaded && (
          <div
            className={cn(
              "border border-dashed rounded-md min-h-[65px]",
              "flex items-center justify-center gap-2 p-4",
              "border-border bg-muted/40",
            )}
          >
            <Loader2
              className="h-5 w-5 text-muted-foreground animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              Loading verification…
            </span>
          </div>
        )}
        <div ref={containerRef} />
      </div>
  );
}
