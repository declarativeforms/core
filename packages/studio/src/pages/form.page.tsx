import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  File,
  FileText,
  Save,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  Badge,
  Button,
  Completion,
  Connections,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FormShareDialog,
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
import { useAuth } from "@/hooks/useAuth";
import { getBackendUrl } from "@/lib/api";
import type {
  IDeclarativeForm,
  IDeclarativeFormCompletion,
  IDeclarativeFormCompletionRule,
  IDeclarativeFormSection,
  ILocalizedText,
  IStudioForm,
  ISubmission,
} from "@declarativeforms/types";

type FormValues = {
  completion:
    | IDeclarativeFormCompletion
    | Array<IDeclarativeFormCompletionRule>
    | undefined;
  connections: IDeclarativeForm["connections"];
  description: string;
  end_date: string;
  mixpanel: string;
  primary: string;
  sections: Array<IDeclarativeFormSection>;
  start_date: string;
  title: string;
};

function getFormValues(form: IDeclarativeForm): FormValues {
  return {
    completion: form.completion,
    connections: form.connections ?? [],
    description: readTextValue(form.description),
    end_date: form.end_date ?? "",
    mixpanel: form.measurements?.mixpanel ?? "",
    primary: form.theme?.primary ?? "",
    sections: form.sections ?? [],
    start_date: form.start_date ?? "",
    title: readTextValue(form.title),
  };
}

function readTextValue(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return (
    Object.values(value).find(
      (entry): entry is string => typeof entry === "string",
    ) ?? ""
  );
}

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const {
    control,
    formState: { isDirty },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      completion: undefined as
        | IDeclarativeFormCompletion
        | Array<IDeclarativeFormCompletionRule>
        | undefined,
      connections: [] as IDeclarativeForm["connections"],
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
  const connections = watch("connections");

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

      return (await response.json()) as IStudioForm;
    },
    enabled: Boolean(params.formId),
  });

  const putForm = useMutation({
    mutationFn: async (data: IStudioForm) => {
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

      return (await response.json()) as IStudioForm;
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

    reset(getFormValues(getForm.data));
  }, [getForm.data, reset]);

  if (!getForm.data) {
    return null;
  }

  const handleMoveSection = (fromIndex: number, toIndex: number) => {
    setValue("sections", moveItem(sections, fromIndex, toIndex), {
      shouldDirty: true,
    });
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

    setValue("sections", nextSections, { shouldDirty: true });
  };

  return (
    <PageShell className="overflow-y-auto">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="size-5 text-muted-foreground" />
              <span className="truncate">
                {readTextValue(getForm.data.title) || "Untitled Form"}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Refine your form settings, structure, and completion flow without
              leaving this page.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Share form"
              title="Share form"
              onClick={() => setIsShareOpen(true)}
            >
              <Share2 />
            </Button>
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
              aria-label={isDirty ? "Save form" : "No changes to save"}
              title={isDirty ? "Save form" : "No changes to save"}
            >
              {isDirty ? <Save /> : <Check />}
            </Button>
          </div>
        </div>

        <FormShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          collaborators={getForm.data.collaborators ?? []}
          currentEmail={user?.email ?? null}
          isSaving={putForm.isPending}
          onSave={async (nextCollaborators) => {
            const savedForm = await putForm.mutateAsync({
              ...getForm.data,
              collaborators: nextCollaborators,
            });
            queryClient.setQueryData(
              ["studio", "forms", params.formId],
              savedForm,
            );
          }}
        />

        <form
          id="form-settings"
          onSubmit={handleSubmit(async (values) => {
            if (!getForm.data || !isDirty) {
              return;
            }

            const savedForm = await putForm.mutateAsync({
              ...getForm.data,
              completion: values.completion,
              connections: values.connections,
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

            reset(getFormValues(savedForm));
          })}
        >
          <Tabs defaultValue="edit">
            <div className="overflow-x-auto overflow-y-hidden">
              <TabsList
                variant="line"
                className="flex w-max min-w-full flex-nowrap justify-start rounded-xl px-1.5 py-1 shadow-sm"
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
                  {!getSubmissions.isLoading ? (
                    <Badge className="ml-1.5" variant="default">
                      {(getSubmissions.data ?? []).length}
                    </Badge>
                  ) : null}
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
                      <FieldDescription>
                        The main heading shown on the live form and in Studio.
                      </FieldDescription>
                      <Input
                        {...field}
                        className="bg-background/80"
                        placeholder="Quarterly feedback survey"
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <FieldDescription>
                        Add a short introduction so respondents know what this
                        form is for.
                      </FieldDescription>
                      <Textarea
                        rows={6}
                        className="min-h-24 resize-none bg-background/80"
                        placeholder="Share a brief summary, expected completion time, or what happens after submission."
                        {...field}
                      />
                    </Field>
                  )}
                />

                {/* <div className="grid min-w-0 gap-3 overflow-hidden sm:grid-cols-2">
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <Field className="min-w-0 overflow-hidden">
                        <FieldLabel>Start date</FieldLabel>
                        <Input
                          type="datetime-local"
                          className="w-full min-w-0 max-w-full bg-background/80"
                          {...field}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <Field className="min-w-0 overflow-hidden">
                        <FieldLabel>End date</FieldLabel>
                        <Input
                          type="datetime-local"
                          className="w-full min-w-0 max-w-full bg-background/80"
                          {...field}
                        />
                      </Field>
                    )}
                  />
                </div> */}

                <Controller
                  name="mixpanel"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Mixpanel token</FieldLabel>
                      <Input
                        {...field}
                        className="bg-background/80"
                        placeholder="3f1f7b3a2e6d..."
                      />
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
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="bg-background/80"
                          placeholder="#111827"
                        />
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
                            { shouldDirty: true },
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
                      setValue(
                        "sections",
                        [
                          ...sections,
                          {
                            id: createSectionId(sections),
                            title: "Untitled Section",
                            fields: [],
                          },
                        ],
                        { shouldDirty: true },
                      )
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
                        setValue(
                          "sections",
                          [
                            {
                              id: createSectionId(sections),
                              title: "",
                              fields: [],
                            },
                          ],
                          { shouldDirty: true },
                        )
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
                  setValue("completion", nextCompletion, { shouldDirty: true })
                }
              />
            </TabsContent>

            <TabsContent className="py-6" value="connections">
              <Connections
                connections={connections}
                onChange={(nextConnections) =>
                  setValue("connections", nextConnections, {
                    shouldDirty: true,
                  })
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
