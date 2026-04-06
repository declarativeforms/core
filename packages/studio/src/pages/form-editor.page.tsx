import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  File,
  FileText,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  SectionField,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  PageShell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components";
import { getBackendUrl } from "@/lib/api";
import type {
  IDeclarativeForm,
  IDeclarativeFormSection,
} from "@declarativeforms/types";

export function FormEditorPage() {
  const params = useParams();
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<
    number | null
  >(null);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      description: "",
      end_date: "",
      mixpanel: "",
      primary: "",
      sections: [] as Array<IDeclarativeFormSection>,
      start_date: "",
      title: "",
    },
  });

  const sections = watch("sections");

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
      sections: getForm.data.sections ?? [],
      start_date: getForm.data.start_date ?? "",
      title: getForm.data.title,
    } as any);

    setExpandedSectionIndex(
      (getForm.data.sections ?? []).length > 0 ? 0 : null,
    );
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
              sections: values.sections,
              title: values.title,
            });
          })}
        >
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
            </TabsContent>

            <TabsContent className="flex flex-col gap-y-3 py-6" value="edit">
              {sections.length > 0 ? (
                sections.map((section, index) => {
                  const isExpanded = expandedSectionIndex === index;

                  return (
                    <Item
                      key={section.id ?? `section-${index}`}
                      variant="outline"
                      className={
                        isExpanded ? "border-foreground/15 bg-muted/5" : ""
                      }
                    >
                      <ItemHeader>
                        <ItemContent>
                          <ItemTitle>{section.title as any}</ItemTitle>
                          <ItemDescription>
                            {section.id || `section_${index + 1}`} •{" "}
                            {section.fields?.length ?? 0}{" "}
                            {(section.fields?.length ?? 0) === 1
                              ? "field"
                              : "fields"}
                          </ItemDescription>
                        </ItemContent>

                        <ItemActions>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setExpandedSectionIndex((current) =>
                                current === index ? null : index,
                              )
                            }
                          >
                            <ChevronDown
                              className={
                                isExpanded
                                  ? "rotate-180 transition-transform"
                                  : "transition-transform"
                              }
                            />
                          </Button>
                        </ItemActions>
                      </ItemHeader>

                      {isExpanded ? (
                        <div className="basis-full border-t border-border pt-4">
                          <FieldGroup>
                            <Field>
                              <FieldLabel>Title</FieldLabel>
                              <Input
                                value={
                                  typeof section.title === "string"
                                    ? section.title
                                    : ""
                                }
                                onChange={(event) =>
                                  setValue(
                                    "sections",
                                    sections.map((sectionItem, sectionIndex) =>
                                      sectionIndex === index
                                        ? {
                                            ...sectionItem,
                                            title: event.target.value,
                                          }
                                        : sectionItem,
                                    ),
                                  )
                                }
                              />
                            </Field>

                            <Field>
                              <FieldLabel>Fields</FieldLabel>
                              <ItemGroup className="gap-3">
                                {(section.fields ?? []).length > 0 ? (
                                  (section.fields ?? []).map(
                                    (field, fieldIndex) => (
                                      <SectionField
                                        key={`field-${fieldIndex}`}
                                        field={field}
                                        onChange={(x) =>
                                          setValue(
                                            "sections",
                                            sections.map(
                                              (sectionItem, sectionIndex) =>
                                                sectionIndex === index
                                                  ? {
                                                      ...sectionItem,
                                                      fields: (
                                                        sectionItem.fields ?? []
                                                      ).map(
                                                        (
                                                          fieldItem,
                                                          currentFieldIndex,
                                                        ) =>
                                                          currentFieldIndex ===
                                                          fieldIndex
                                                            ? x
                                                            : fieldItem,
                                                      ),
                                                    }
                                                  : sectionItem,
                                            ),
                                          )
                                        }
                                      />
                                    ),
                                  )
                                ) : (
                                  <Item
                                    variant="outline"
                                    className="bg-muted/10"
                                  >
                                    <ItemContent>
                                      <ItemTitle>No fields yet</ItemTitle>
                                      <ItemDescription>
                                        This section does not have any fields
                                        yet.
                                      </ItemDescription>
                                    </ItemContent>
                                  </Item>
                                )}
                              </ItemGroup>
                            </Field>
                          </FieldGroup>
                        </div>
                      ) : null}
                    </Item>
                  );
                })
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <File />
                    </EmptyMedia>
                    <EmptyTitle>No Sections Yet</EmptyTitle>
                    <EmptyDescription>
                      Add sections to start editing your form structure.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline">Add Section</Button>
                  </EmptyContent>
                </Empty>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </PageShell>
  );
}
