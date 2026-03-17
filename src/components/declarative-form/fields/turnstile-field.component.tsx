import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { DeclarativeFieldComponentProps } from "../renderer/field-contract";
import { FormControl } from "@/components/ui/form";
import { useFormI18n } from "../renderer/use-form-i18n";
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
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const sitekey = import.meta.env.VITE_TURNSTILE_SITEKEY as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(
    () => !!window.turnstile,
  );

  // Load the Turnstile script
  useEffect(() => {
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      // Script tag exists but hasn't loaded yet — wait for it
      const check = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    let aborted = false;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (!aborted) setScriptLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      aborted = true;
    };
  }, []);

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
    <FormControl>
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
              {t("turnstile.loading")}
            </span>
          </div>
        )}
        <div ref={containerRef} />
      </div>
    </FormControl>
  );
}
