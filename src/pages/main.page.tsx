import yaml from "js-yaml";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DeclarativeForm,
  type IDeclarativeForm,
} from "@/components";

export function MainPage() {
  const [searchParams] = useSearchParams();

  const { data: form } = useQuery({
    queryKey: ["form"],
    queryFn: async () => {
      const response = await fetch("/findhomes-001.yaml");

      return yaml.load(await response.text()) as IDeclarativeForm;
    },
  });

  const [data] = useState<FieldValues>(() => {
    const initialData: FieldValues = {};

    for (const [key, value] of searchParams.entries()) {
      initialData[key] = value;
    }

    return initialData;
  });

  if (!form) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-3 py-12">
      <Card className="mb-6 w-full">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description ? (
            <CardDescription>{form.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <DeclarativeForm form={form} initialData={data} />
        </CardContent>
      </Card>

      <div className="text-center text-muted-foreground text-xs">
        Powered by{" "}
        <a
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Declarative Forms
        </a>
      </div>
    </div>
  );
}
