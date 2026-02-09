import type { ReactNode } from "react";

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
  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
      <Card className="mb-10 w-full bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-200">
          <CardTitle className="text-2xl md:text-3xl font-bold leading-tight">
            {props.title}
          </CardTitle>
          {props.description ? (
            <CardDescription className="mt-2 text-base text-gray-500 leading-relaxed">
              {props.description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="p-6 pt-5">{props.children}</CardContent>
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
