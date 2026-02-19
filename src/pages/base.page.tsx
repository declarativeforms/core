import { useEffect, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";

export function BasePage(props: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${props.title} — Declarative Forms`;
  }, [props.title]);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
      <Card className="mb-10 w-full bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="px-6 !pb-0 border-b border-gray-200">
          <CardTitle className="text-2xl/7.5 font-semibold">
            {props.title}
          </CardTitle>
          {props.description ? (
            <CardDescription className="mb-3 mt-2 text-sm text-gray-500">
              {props.description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="px-6">{props.children}</CardContent>
      </Card>

      <div className="text-center text-gray-500 text-xs tracking-wide space-x-2">
        <span>
          Powered by{" "}
          <a
            href="/declarativeforms/examples/advanced"
            className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            Declarative Forms
          </a>
        </span>
        <span>•</span>
        <a
          href="/privacy-policy"
          className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
