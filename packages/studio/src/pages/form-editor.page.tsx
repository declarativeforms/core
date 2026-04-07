import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, ExternalLink, File, FileText, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
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
  Section,
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
  ISubmission,
} from "@declarativeforms/types";

function createSectionId(sections: IDeclarativeFormSection[]) {
  const existingIds = new Set(
    sections.map((section) => section.id).filter(Boolean),
  );
  let index = sections.length + 1;

  while (existingIds.has(`section_${index}`)) {
    index += 1;
  }

  return `section_${index}`;
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateSubmissionId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function FormEditorPage() {
  const params = useParams();
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<
    string | null
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

  const getSubmissions = useQuery({
    queryKey: ["studio", "forms", params.formId, "submissions"],
    queryFn: async () => {
      const response = await fetch(
        getBackendUrl(`studio/forms/${params.formId}/submissions`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studio_auth_token")}`,
          },
        },
      );

      return (await response.json()) as ISubmission[];
    },
    enabled: Boolean(params.formId),
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
          <Tabs defaultValue="edit">
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
                <>
                  {sections.map((section, index) => {
                    return (
                      <Section
                        key={section.id ?? `section-${index}`}
                        section={section}
                        index={index}
                        sections={sections}
                        onChange={(nextSection) =>
                          setValue(
                            "sections",
                            sections.map((sectionItem, sectionIndex) =>
                              sectionIndex === index ? nextSection : sectionItem,
                            ),
                          )
                        }
                      />
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setValue("sections", [
                        ...sections,
                        {
                          id: createSectionId(sections),
                          title: "",
                          fields: [],
                        },
                      ])
                    }
                  >
                    <File />
                    Add Section
                  </Button>
                </>
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setValue("sections", [
                          {
                            id: createSectionId(sections),
                            title: "",
                            fields: [],
                          },
                        ])
                      }
                    >
                      Add Section
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </TabsContent>

            <TabsContent className="py-6" value="results">
              {getSubmissions.isLoading ? null : getSubmissions.isError ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <File />
                    </EmptyMedia>
                    <EmptyTitle>Unable To Load Results</EmptyTitle>
                    <EmptyDescription>
                      Studio couldn&apos;t fetch form submissions from the API.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (getSubmissions.data ?? []).length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <File />
                    </EmptyMedia>
                    <EmptyTitle>No Results Yet</EmptyTitle>
                    <EmptyDescription>
                      Form submissions will appear here once responses start
                      coming in.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ItemGroup className="gap-3">
                  {(getSubmissions.data ?? []).map((submission) => {
                    const isExpanded = expandedSubmissionId === submission.id;

                    return (
                      <Item
                        key={submission.id}
                        variant="outline"
                        className={
                          isExpanded ? "border-foreground/15 bg-muted/5" : ""
                        }
                      >
                        <ItemHeader>
                          <ItemContent>
                            <ItemTitle>
                              {truncateSubmissionId(submission.id)}
                            </ItemTitle>
                            <ItemDescription>
                              {formatSubmittedAt(submission.created_at)}
                            </ItemDescription>
                          </ItemContent>

                          <ItemActions>
                            <Badge
                              variant={
                                submission.status === "completed"
                                  ? "completed"
                                  : "partial"
                              }
                            >
                              {submission.status}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setExpandedSubmissionId((current) =>
                                  current === submission.id
                                    ? null
                                    : submission.id,
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
                            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-sm text-foreground">
                              <code>
                                {JSON.stringify(submission.data, null, 2)}
                              </code>
                            </pre>
                          </div>
                        ) : null}
                      </Item>
                    );
                  })}
                </ItemGroup>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </PageShell>
  );
}
