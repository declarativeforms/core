import { ArrowLeft, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Button,
  CompletionEditor,
  EmptyState,
  FormBuilder,
  FormProperties,
  Input,
  PageShell,
  ResultsPanel,
  SharePanel,
  TabPageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components";
import {
  useCreateForm,
  useDeleteForm,
  useForm,
  useUpdateForm,
} from "@/hooks";
import { createEmptyFormDefinition } from "@/lib/default-form";
import type { IDeclarativeForm } from "@/lib/declarative-form-types";
import {
  getLocalizedTextPreview,
  updateLocalizedTextAtLocale,
} from "@/lib/localized-text";

type FormEditorState = {
  form: IDeclarativeForm;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function cloneForm(form: IDeclarativeForm) {
  return JSON.parse(JSON.stringify(form)) as IDeclarativeForm;
}

function normalizeForm(form: IDeclarativeForm, id: string): IDeclarativeForm {
  // Strip server-managed metadata so that comparisons only consider
  // user-editable fields. Without this, a fresh `updated_at` returned by
  // the API after each save would differ from the editor state, causing an
  // infinite save loop.
  const { _id, created_at, updated_at, ...rest } = form as IDeclarativeForm & {
    _id?: unknown;
  };

  return {
    ...rest,
    id,
  };
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text =
    state === "saving"
      ? "Saving..."
      : state === "saved"
        ? "Saved"
        : state === "error"
          ? "Save failed"
          : "Ready";

  const textClassName =
    state === "error"
      ? "text-destructive"
      : state === "saving"
        ? "text-foreground"
        : "text-muted-foreground";

  const dotClassName =
    state === "saved"
      ? "bg-emerald-500"
      : state === "saving"
        ? "bg-amber-500"
        : state === "error"
          ? "bg-destructive"
          : "bg-muted-foreground/40";

  return (
    <span className={`flex items-center gap-1.5 text-xs ${textClassName}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${dotClassName}`} />
      {text}
    </span>
  );
}

function EditorTabSection({
  title,
  description,
  children,
  actions,
  maxWidth = "xl",
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "xl" | "3xl";
}) {
  return (
    <div
      className={`mx-auto w-full space-y-5 ${maxWidth === "3xl" ? "max-w-3xl" : "max-w-xl"}`}
    >
      <TabPageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export function FormEditorPage() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const currentFormId = formId ?? "new";
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();
  const {
    data: loadedForm,
    isLoading,
    isError,
  } = useForm(currentFormId);
  const [editorState, setEditorState] = useState<FormEditorState>({
    form: createEmptyFormDefinition(),
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const createRequestedRef = useRef(false);
  const hydratedFormIdRef = useRef<string | null>(null);
  const lastPersistedSerializedRef = useRef("");
  const saveGenerationRef = useRef(0);

  // Keep a ref-based stable reference to mutateAsync so the auto-save
  // effect does not re-run every time the mutation state object changes.
  const updateFormRef = useRef(updateForm.mutateAsync);
  updateFormRef.current = updateForm.mutateAsync;

  const stableMutateAsync = useCallback(
    (...args: Parameters<typeof updateForm.mutateAsync>) =>
      updateFormRef.current(...args),
    [],
  );

  const createFormRef = useRef(createForm.mutateAsync);
  createFormRef.current = createForm.mutateAsync;

  const stableCreateAsync = useCallback(
    (...args: Parameters<typeof createForm.mutateAsync>) =>
      createFormRef.current(...args),
    [],
  );

  useEffect(() => {
    document.title = "Edit Form — Studio";
  }, []);

  useEffect(() => {
    createRequestedRef.current = false;
    hydratedFormIdRef.current = null;
    lastPersistedSerializedRef.current = "";
    saveGenerationRef.current += 1;
    setEditorState({
      form: createEmptyFormDefinition(),
    });
    setSaveState("idle");
  }, [currentFormId]);

  useEffect(() => {
    if (currentFormId !== "new" || createRequestedRef.current) {
      return;
    }

    createRequestedRef.current = true;

    void stableCreateAsync(createEmptyFormDefinition()).then((form) => {
      if (form.id) {
        navigate(`/forms/${form.id}`, { replace: true });
      }
    });
  }, [currentFormId, navigate, stableCreateAsync]);

  useEffect(() => {
    if (currentFormId === "new" || !loadedForm) {
      return;
    }

    if (hydratedFormIdRef.current === currentFormId) {
      return;
    }

    const nextForm = cloneForm(loadedForm);
    const nextSerialized = JSON.stringify(normalizeForm(nextForm, currentFormId));

    setEditorState({ form: nextForm });
    hydratedFormIdRef.current = currentFormId;
    lastPersistedSerializedRef.current = nextSerialized;
    setSaveState("saved");
  }, [currentFormId, loadedForm]);

  useEffect(() => {
    if (currentFormId === "new" || hydratedFormIdRef.current !== currentFormId) {
      return;
    }

    const nextForm = normalizeForm(editorState.form, currentFormId);
    const nextSerialized = JSON.stringify(nextForm);

    if (nextSerialized === lastPersistedSerializedRef.current) {
      return;
    }

    const generation = ++saveGenerationRef.current;
    setSaveState("saving");

    const timer = window.setTimeout(() => {
      void stableMutateAsync({
        id: currentFormId,
        form: nextForm,
      })
        .then((savedForm) => {
          lastPersistedSerializedRef.current = JSON.stringify(
            normalizeForm(savedForm, currentFormId),
          );

          if (saveGenerationRef.current === generation) {
            setSaveState("saved");
          }
        })
        .catch(() => {
          if (saveGenerationRef.current === generation) {
            setSaveState("error");
          }
        });
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentFormId, editorState.form, stableMutateAsync]);

  const persistedFormId =
    currentFormId === "new"
      ? ""
      : typeof editorState.form.id === "string" && editorState.form.id.trim().length > 0
        ? editorState.form.id
        : currentFormId;

  const titleValue = getLocalizedTextPreview(editorState.form.title);

  const handleDelete = async () => {
    if (!persistedFormId) {
      return;
    }

    await deleteForm.mutateAsync(persistedFormId);
    navigate("/", { replace: true });
  };

  if (currentFormId === "new") {
    return (
      <PageShell className="items-center justify-center">
        <EmptyState
          icon={createForm.isError ? <FileText className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
          title={createForm.isError ? "Unable to create form" : "Creating form..."}
          description={
            createForm.isError
              ? "Studio couldn’t create a new form. Try again in a moment."
              : "Preparing your form editor."
          }
        />
      </PageShell>
    );
  }

  if (isLoading && hydratedFormIdRef.current !== currentFormId) {
    return (
      <PageShell className="items-center justify-center">
        <EmptyState icon={<Loader2 className="size-5 animate-spin" />} title="Loading form..." description="Fetching the latest form definition." />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell className="items-center justify-center">
        <EmptyState
          icon={<FileText className="size-5" />}
          title="Unable to load form"
          description="Studio couldn’t fetch this form from the API."
          action={
            <Button asChild type="button" variant="outline" size="sm">
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild type="button" variant="ghost" size="icon-sm">
              <Link to="/" aria-label="Back to forms">
                <ArrowLeft />
              </Link>
            </Button>

            <Input
              value={titleValue}
              onChange={(event) => {
                setEditorState((current) => ({
                  ...current,
                  form: {
                    ...current.form,
                    title: updateLocalizedTextAtLocale(
                      current.form.title,
                      event.target.value,
                      current.form.locale,
                    ),
                  },
                }));
              }}
              placeholder="Untitled Form"
              aria-label="Form title"
              className="h-8 max-w-xl border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SaveIndicator state={saveState} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteForm.isPending}
            >
              <Trash2 />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="edit" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 border-b border-border bg-background px-4">
            <TabsList variant="line" className="h-11 w-auto gap-1 p-0">
              <TabsTrigger value="settings" className="px-3">
                Settings
              </TabsTrigger>
              <TabsTrigger value="edit" className="px-3">
                Edit
              </TabsTrigger>
              <TabsTrigger value="completion" className="px-3">
                Completion
              </TabsTrigger>
              <TabsTrigger value="share" className="px-3">
                Share
              </TabsTrigger>
              <TabsTrigger value="results" className="px-3">
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="settings" className="mt-0 min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <EditorTabSection
              title="Settings"
              description="Configure your form's general properties, appearance, and integrations."
            >
              <FormProperties
                form={editorState.form}
                onChange={(nextForm) => {
                  setEditorState((current) => ({
                    ...current,
                    form: nextForm,
                  }));
                }}
              />
            </EditorTabSection>
          </TabsContent>

          <TabsContent value="edit" className="mt-0 min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <EditorTabSection
              title="Edit"
              description="Add and arrange the fields in your form."
            >
              <FormBuilder
                form={editorState.form}
                onChange={(nextForm) => {
                  setEditorState((current) => ({
                    ...current,
                    form: nextForm,
                  }));
                }}
              />
            </EditorTabSection>
          </TabsContent>

          <TabsContent value="completion" className="mt-0 min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <EditorTabSection
              title="Completion"
              description="Configure what users see after completing the form."
            >
              <CompletionEditor
                form={editorState.form}
                onChange={(nextForm) => {
                  setEditorState((current) => ({
                    ...current,
                    form: nextForm,
                  }));
                }}
              />
            </EditorTabSection>
          </TabsContent>

          <TabsContent value="share" className="mt-0 min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <EditorTabSection
              title="Share"
              description="Share your form via link, embed code, or QR code."
              maxWidth="3xl"
            >
              <SharePanel formId={persistedFormId} />
            </EditorTabSection>
          </TabsContent>

          <TabsContent value="results" className="mt-0 min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <EditorTabSection
              title="Responses"
              description="Review submissions and inspect the data captured by this form."
              maxWidth="3xl"
              actions={
                <Button type="button" variant="outline" size="sm">
                  <Download />
                  Export
                </Button>
              }
            >
              <ResultsPanel formId={persistedFormId} showHeader={false} />
            </EditorTabSection>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
