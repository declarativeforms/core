import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { CookieConsent } from "@/components/cookie-consent";

export function BasePage(props: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
      <Card className="mb-8 w-full bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-bold tracking-tight text-neutral-900">
            {props.title}
          </CardTitle>
          {props.description ? (
            <CardDescription className="mt-2 text-base text-neutral-500 leading-normal">
              {props.description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="p-6 pt-3">{props.children}</CardContent>
      </Card>

      <div className="text-center text-neutral-400 text-xs tracking-wide space-x-2">
        <span>
          Powered by{" "}
          <a
            href="/declarativeforms/examples/advanced"
            className="font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline transition-colors"
          >
            Declarative Forms
          </a>
        </span>
        <span>•</span>
        <a
          href="/privacy-policy"
          className="font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline transition-colors"
        >
          Privacy Policy
        </a>
      </div>

      <CookieConsent />
    </div>
  );
}
