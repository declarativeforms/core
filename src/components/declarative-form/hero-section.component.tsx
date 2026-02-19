import { useEffect } from "react";

import { Button } from "@/components";
import { useI18n } from "@/i18n";

export function HeroSection(props: {
  title: string;
  description?: string;
  onAction?: () => void;
  buttonLabel?: string;
  buttonHref?: string;
}) {
  const { t, withLang } = useI18n();

  useEffect(() => {
    document.title = `${props.title} — Declarative Forms`;
  }, [props.title]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-2xl mx-auto text-center px-6 md:px-0">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 mb-8">
          {props.title}
        </h1>

        {props.description ? (
          <p className="text-lg md:text-xl font-normal leading-relaxed text-gray-600 mb-10">
            {props.description}
          </p>
        ) : null}

        {props.buttonHref ? (
          <a
            href={props.buttonHref}
            className="inline-flex items-center justify-center w-full h-12 px-6 text-base font-semibold leading-none rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {props.buttonLabel ?? t("hero.continue")}
          </a>
        ) : props.onAction ? (
          <Button
            className="w-full h-12 px-6 text-base font-semibold leading-none"
            onClick={() => props.onAction?.()}
          >
            {t("hero.continue")}
          </Button>
        ) : null}
      </div>

      <div className="absolute bottom-8 text-center w-full px-4">
        <p className="text-xs text-gray-500">
          {t("base.powered_by")}{" "}
          <a
            href={withLang("/")}
            className="font-medium text-gray-900 hover:underline underline-offset-4"
          >
            Declarative Forms
          </a>
        </p>
      </div>
    </div>
  );
}
