import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { IDeclarativeForm } from "@/lib/declarative-form-types";
import {
  createEmptyFormDefinition,
  createForm,
  ensureForm,
  saveForm,
} from "@/lib/mock-data";

type FormEditorState = {
  form: IDeclarativeForm;
};

function cloneForm(form: IDeclarativeForm) {
  return JSON.parse(JSON.stringify(form)) as IDeclarativeForm;
}

function PlaceholderPanel({ children }: { children: string }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <EmptyState title={children} className="max-w-none" />
    </div>
  );
}

export function FormEditorPage() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const currentFormId = formId ?? "new";
  const [editorState, setEditorState] = useState<FormEditorState>({
    form: createEmptyFormDefinition(),
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = "Edit Form — Studio";
  }, []);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSaved(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [saved]);

  useEffect(() => {
    if (currentFormId === "new") {
      const nextForm = createForm();
      navigate(`/forms/${nextForm.id}`, { replace: true });
      return;
    }

    const nextRecord = ensureForm(currentFormId);
    setEditorState({
      form: cloneForm(nextRecord.form),
    });
  }, [currentFormId, navigate]);

  const displayTitle =
    typeof editorState.form.title === "string" && editorState.form.title.trim()
      ? editorState.form.title
      : "Untitled Form";

  const persistedFormId =
    typeof editorState.form.id === "string" && editorState.form.id.trim()
      ? editorState.form.id
      : currentFormId;

  const handleSave = () => {
    if (!persistedFormId) {
      return;
    }

    saveForm({
      ...editorState.form,
      id: persistedFormId,
    });
    setSaved(true);
  };

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
              value={displayTitle}
              onChange={(event) => {
                const nextTitle = event.target.value;

                setEditorState((current) => ({
                  ...current,
                  form: {
                    ...current.form,
                    title: nextTitle,
                  },
                }));
              }}
              aria-label="Form title"
              className="h-auto max-w-xl border-transparent bg-transparent px-0 text-base font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleSave}>
              {saved ? "Saved!" : "Save"}
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
