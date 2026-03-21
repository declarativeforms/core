import { useEffect, useState } from "react";

import { useI18n } from "@/i18n";
import { Button } from "./ui";

const COOKIE_CONSENT_KEY = "cookie-consent-001";

export function CookieConsent() {
  const { t, withLang } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!value || value === "false") {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-gray-600 flex-1">
          {t("cookie.message")}{" "}
          <a
            href={withLang("/privacy-policy")}
            className="text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            {t("cookie.learn_more")}
          </a>
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:shrink-0">
          <Button
            onClick={() => {
              localStorage.setItem(COOKIE_CONSENT_KEY, "false");
              setIsVisible(false);
            }}
            size="sm"
            variant="outline"
          >
            {t("cookie.decline")}
          </Button>
          <Button
            onClick={() => {
              localStorage.setItem(COOKIE_CONSENT_KEY, "true");
              setIsVisible(false);
            }}
            size="sm"
          >
            {t("cookie.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
