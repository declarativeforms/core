import { ArrowLeft, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Button,
  EmptyState,
  FormBuilder,
  Input,
  PageShell,
  ResultsPanel,
  SharePanel,
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
import type { IDeclarativeForm, ILocalizedText } from "@/lib/declarative-form-types";

type FormEditorState = {
  form: IDeclarativeForm;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function cloneForm(form: IDeclarativeForm) {
  return JSON.parse(JSON.stringify(form)) as IDeclarativeForm;
}

function getEditableText(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (!value) {
    return "";
  }

  const firstTextValue = Object.values(value).find(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  );

  return typeof firstTextValue === "string" ? firstTextValue : "";
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

function PlaceholderPanel({ children }: { children: string }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <EmptyState title={children} className="max-w-none" />
    </div>
  );
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

  const className =
    state === "error"
      ? "text-destructive"
      : state === "saving"
        ? "text-foreground"
        : "text-muted-foreground";

  return <span className={`text-sm ${className}`}>{text}</span>;
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

  const titleValue = getEditableText(editorState.form.title);

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
        <EmptyState title="Loading form..." description="Fetching the latest form definition." />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell className="items-center justify-center">
        <EmptyState
          title="Unable to load form"
          description="Studio couldn’t fetch this form from the API."
          action={
            <Button asChild type="button" variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
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
                    title: event.target.value,
                  },
                }));
              }}
              placeholder="Untitled Form"
              aria-label="Form title"
              className="h-auto max-w-xl border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleteForm.isPending}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="edit" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 border-b border-border bg-background px-4">
            <TabsList variant="line" className="h-12 w-auto gap-1 p-0">
              <TabsTrigger value="edit" className="px-3">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="px-3">
                Preview
              </TabsTrigger>
              <TabsTrigger value="share" className="px-3">
                Share
              </TabsTrigger>
              <TabsTrigger value="results" className="px-3">
                Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="mt-0 flex min-h-0 flex-1 overflow-hidden p-4">
            <div className="min-h-0 flex-1 overflow-hidden">
              <FormBuilder
                form={editorState.form}
                onChange={(nextForm) => {
                  setEditorState((current) => ({
                    ...current,
                    form: nextForm,
                  }));
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 min-h-0 flex-1 overflow-y-auto p-6">
            <PlaceholderPanel>Form preview goes here</PlaceholderPanel>
          </TabsContent>

          <TabsContent value="share" className="mt-0 min-h-0 flex-1 overflow-y-auto p-6">
            <SharePanel formId={persistedFormId} />
          </TabsContent>

          <TabsContent value="results" className="mt-0 min-h-0 flex-1 overflow-y-auto p-6">
            <ResultsPanel formId={persistedFormId} />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
