import yaml from "js-yaml";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type IDeclarativeForm,
} from "@/components";

export function AdminSlugSubmissionsPage() {
  const params = useParams();

  const { data: form } = useQuery({
    queryKey: ["form", params.id, params.owner, params.repository, params.file],
    queryFn: async () => {
      const response = await fetch(
        params.id
          ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.id}`
          : params.owner && params.repository && params.file
          ? `https://declarativeforms-api-2k4ts.ondigitalocean.app/api/v1/forms/${params.owner}/${params.repository}/${params.file}`
          : "/default.yaml"
      );

      return yaml.load(await response.text()) as IDeclarativeForm;
    },
  });

  // const orderedFields: Array<IDeclarativeFormField> =
  //   form?.sections.flatMap((section) => section.fields) || [];

  if (!form) {
    return;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
      <Card className="mb-8 w-full bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-bold tracking-tight text-neutral-900">
            {form.title}
          </CardTitle>
          <CardDescription className="mt-2 text-base text-neutral-500 leading-normal">
            {params.owner}/{params.repository}/{params.file}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-3">Hello</CardContent>
      </Card>

      <div className="text-center text-neutral-400 text-xs tracking-wide">
        Powered by{" "}
        <a
          href="/"
          className="font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline transition-colors"
        >
          Declarative Forms
        </a>
      </div>
    </div>
  );
}
