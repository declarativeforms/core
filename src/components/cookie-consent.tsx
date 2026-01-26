"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted-1";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-lg mx-auto bg-white border border-neutral-200 rounded-lg shadow-sm px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-600 flex-1">
          We use cookies to improve your experience.{" "}
          <a
            href="/privacy-policy"
            className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600 transition-colors"
          >
            Learn more
          </a>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={handleDecline}
            size="sm"
            variant="outline"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
