import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileText, Pencil, Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  PageShell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components";
import { getBackendUrl } from "@/lib/api";
import type { IDeclarativeForm } from "@declarativeforms/types";

export function FormEditorPage() {
  const params = useParams();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      description: "",
      end_date: "",
      mixpanel: "",
      primary: "",
      start_date: "",
      title: "",
    },
  });

  const getForm = useQuery({
    queryKey: ["studio", "forms", params.formId],
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`studio/forms/${params.formId}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studio_auth_token")}`,
          },
        },
      );

      return (await response.json()) as IDeclarativeForm;
    },
    enabled: Boolean(params.formId),
  });

  const putForm = useMutation({
    mutationFn: async (data: IDeclarativeForm) => {
      const response = await fetch(
        getBackendUrl(`studio/forms/${params.formId}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("studio_auth_token")}`,
          },
          body: JSON.stringify(data),
        },
      );

      return (await response.json()) as IDeclarativeForm;
    },
  });

  useEffect(() => {
    if (!getForm.data) {
      return;
    }

    reset({
      description: getForm.data.description,
      end_date: getForm.data.end_date ?? "",
      mixpanel: getForm.data.measurements?.mixpanel ?? "",
      primary: getForm.data.theme?.primary ?? "",
      start_date: getForm.data.start_date ?? "",
      title: getForm.data.title,
    } as any);
  }, [getForm.data]);

  if (!getForm.data) {
    return null;
  }

  return (
    <PageShell className="overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="size-5 text-muted-foreground" />
            {getForm.data.title as any}
          </h1>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Copy form link"
              title="Copy form link"
              onClick={async () =>
                await navigator.clipboard.writeText(
                  `https://frms.dev/${params.formId}`,
                )
              }
            >
              <Copy />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Open form preview"
              title="Open form preview"
              onClick={() =>
                window.open(
                  `https://frms.dev/${params.formId}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <ExternalLink />
            </Button>
            <Button
              type="submit"
              variant="outline"
              size="icon-sm"
              form="form-settings"
              disabled={putForm.isPending}
              aria-label="Save form"
              title="Save form"
            >
              <Save />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="settings">
          <div className="overflow-x-auto">
            <TabsList
              variant="line"
              className="flex w-max min-w-full flex-nowrap justify-start"
            >
              <TabsTrigger value="settings" className="shrink-0">
                Settings
              </TabsTrigger>
              <TabsTrigger value="edit" className="shrink-0">
                Edit
              </TabsTrigger>
              <TabsTrigger value="completion" className="shrink-0">
                Completion
              </TabsTrigger>
              <TabsTrigger value="connections" className="shrink-0">
                Connections
              </TabsTrigger>
              <TabsTrigger value="results" className="shrink-0">
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent className="py-6" value="settings">
            <form
              id="form-settings"
              onSubmit={handleSubmit(async (values) => {
                if (!getForm.data) {
                  return;
                }

                await putForm.mutateAsync({
                  ...getForm.data,
                  description: values.description,
                  end_date: values.end_date || undefined,
                  measurements: {
                    ...getForm.data.measurements,
                    mixpanel: values.mixpanel || undefined,
                  },
                  start_date: values.start_date || undefined,
                  theme: {
                    ...getForm.data.theme,
                    primary: values.primary || undefined,
                  },
                  title: values.title,
                });
              })}
            >
              <FieldGroup>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Title</FieldLabel>
                      <Input {...field} />
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        rows={6}
                        className="min-h-24 resize-none"
                        {...field}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Start date</FieldLabel>
                      <Input type="datetime-local" {...field} />
                    </Field>
                  )}
                />

                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>End date</FieldLabel>
                      <Input type="datetime-local" {...field} />
                    </Field>
                  )}
                />

                <Controller
                  name="mixpanel"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Mixpanel token</FieldLabel>
                      <Input {...field} />
                    </Field>
                  )}
                />

                <Controller
                  name="primary"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Primary color</FieldLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={field.value || "#6366f1"}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-background p-0.5"
                        />
                        <Input {...field} value={field.value ?? ""} />
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent className="flex py-6 flex-col gap-y-3" value="edit">
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>Section #1</ItemTitle>
                <ItemDescription>3 fields</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="icon-sm">
                  <Pencil />
                </Button>
              </ItemActions>
            </Item>

            <Item variant="outline">
              <ItemContent>
                <ItemTitle>Section #2</ItemTitle>
                <ItemDescription>3 fields</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="icon-sm">
                  <Pencil />
                </Button>
              </ItemActions>
            </Item>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
