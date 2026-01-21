import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { DeclarativeForm } from "@/components";

export function MainPage() {
  const [searchParams] = useSearchParams();

  const [data] = useState<FieldValues>(() => {
    const initialData: FieldValues = {};

    for (const [key, value] of searchParams.entries()) {
      initialData[key] = value;
    }

    return initialData;
  });

  return <DeclarativeForm initialData={data} />;
}
