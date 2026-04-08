import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, File, FileText, Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  Button,
  Completion,
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
  ItemGroup,
  PageShell,
  Section,
  Submission,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components";
import { getBackendUrl } from "@/lib/api";
import type {
  IDeclarativeForm,
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
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

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);

  if (item === undefined) {
    return items;
  }

  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function replaceDeletedSectionReference(
  section: IDeclarativeFormSection,
  deletedSectionId: string,
) {
  if (typeof section.next === "string") {
    return section.next === deletedSectionId
      ? { ...section, next: "done" }
      : section;
  }

  if (!Array.isArray(section.next)) {
    return section;
  }

  return {
    ...section,
    next: section.next.map((rule) => {
      if ("when" in rule) {
        return rule.go === deletedSectionId ? { ...rule, go: "done" } : rule;
      }

      if ("else" in rule) {
        return rule.else === deletedSectionId ? { else: "done" } : rule;
      }

      return rule;
    }),
  };
}

export function FormPage() {
  const params = useParams();

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      completion: undefined as
        | IDeclarativeFormCompletion
        | Array<IDeclarativeFormCompletionRule>
        | undefined,
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
  const completion = watch("completion");

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
      completion: getForm.data.completion,
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

  const handleMoveSection = (fromIndex: number, toIndex: number) => {
    setValue("sections", moveItem(sections, fromIndex, toIndex));
  };

  const handleDeleteSection = (sectionIndex: number) => {
    const deletedSection = sections[sectionIndex];
    const nextSections = sections
      .filter((_, currentSectionIndex) => currentSectionIndex !== sectionIndex)
      .map((section) =>
        deletedSection?.id
          ? replaceDeletedSectionReference(section, deletedSection.id)
          : section,
      );

    setValue("sections", nextSections);
  };

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
              completion: values.completion,
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
            <div className="overflow-x-auto overflow-y-hidden">
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
                {/* <TabsTrigger value="connections" className="shrink-0">
                  Connections
                </TabsTrigger> */}
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

                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <Field className="min-w-0">
                        <FieldLabel>Start date</FieldLabel>
                        <Input
                          type="datetime-local"
                          className="w-full min-w-0"
                          {...field}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <Field className="min-w-0">
                        <FieldLabel>End date</FieldLabel>
                        <Input
                          type="datetime-local"
                          className="w-full min-w-0"
                          {...field}
                        />
                      </Field>
                    )}
                  />
                </div>

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
                        canMoveUp={index > 0}
                        canMoveDown={index < sections.length - 1}
                        onChange={(nextSection) =>
                          setValue(
                            "sections",
                            sections.map((sectionItem, sectionIndex) =>
                              sectionIndex === index
                                ? nextSection
                                : sectionItem,
                            ),
                          )
                        }
                        onMoveUp={() => handleMoveSection(index, index - 1)}
                        onMoveDown={() => handleMoveSection(index, index + 1)}
                        onDelete={() => handleDeleteSection(index)}
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
                          title: "Untitled Section",
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

            <TabsContent className="py-6" value="completion">
              <Completion
                completion={completion}
                onChange={(nextCompletion) =>
                  setValue("completion", nextCompletion)
                }
              />
            </TabsContent>

            <TabsContent className="py-6" value="results">
              {getSubmissions.isLoading ? null : (getSubmissions.data ?? [])
                  .length === 0 ? (
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
                  {(getSubmissions.data ?? []).map((submission) => (
                    <Submission key={submission.id} submission={submission} />
                  ))}
                </ItemGroup>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </PageShell>
  );
}
