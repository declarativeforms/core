import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { FormBuilder } from "@/components/form-builder";
import type { IDeclarativeForm } from "@/lib/declarative-form-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FormStatus = "draft" | "published";

type FormEditorState = {
  form: IDeclarativeForm;
  status: FormStatus;
};

const defaultFormTemplate: IDeclarativeForm = {
  version: 1,
  title: "Untitled Form",
  description: "A sample declarative form",
  sections: [
    {
      id: "personal_info",
      title: "Personal Information",
      fields: [
        {
          id: "first_name",
          type: "short_text",
          label: "First Name",
          placeholder: "Enter your first name",
          validators: ["required"],
        },
        {
          id: "last_name",
          type: "short_text",
          label: "Last Name",
          placeholder: "Enter your last name",
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "you@example.com",
          validators: ["required"],
        },
      ],
      next: "done",
    },
  ],
  completion: {
    title: "Thank you!",
    message: "Thanks for submitting.",
  },
};

const formEditorMocks: Record<string, FormEditorState> = {
  "customer-feedback": {
    status: "published",
    form: {
      ...defaultFormTemplate,
      id: "customer-feedback",
      title: "Customer Feedback Survey",
      description: "Capture product feedback from recent customers.",
    },
  },
  "event-registration": {
    status: "draft",
    form: {
      ...defaultFormTemplate,
      id: "event-registration",
      title: "Spring Event Registration",
      description: "Collect attendee details for the upcoming event.",
    },
  },
  "support-intake": {
    status: "published",
    form: {
      ...defaultFormTemplate,
      id: "support-intake",
      title: "Support Request Intake",
      description: "Route incoming support requests through triage.",
    },
  },
  "job-application": {
    status: "draft",
    form: {
      ...defaultFormTemplate,
      id: "job-application",
      title: "Frontend Role Application",
      description: "Screen candidates for the studio hiring pipeline.",
    },
  },
};

function cloneForm(form: IDeclarativeForm) {
  return JSON.parse(JSON.stringify(form)) as IDeclarativeForm;
}

function createFormEditorState(formId: string) {
  if (formId === "new") {
    return {
      form: cloneForm({
        ...defaultFormTemplate,
        id: undefined,
      }),
      status: "draft" as const,
    };
  }

  const mockState = formEditorMocks[formId];

  if (mockState) {
    return {
      form: cloneForm(mockState.form),
      status: mockState.status,
    };
  }

  return {
    form: cloneForm({
      ...defaultFormTemplate,
      id: formId,
    }),
    status: "draft" as const,
  };
}

function PlaceholderPanel({ children }: { children: string }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <p className="text-sm font-medium text-muted-foreground">{children}</p>
    </div>
  );
}

function StatusIndicator({ status }: { status: FormStatus }) {
  const className =
    status === "published"
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${className}`}
    >
      {status}
    </span>
  );
}

export function FormEditorPage() {
  const { formId } = useParams();
  const currentFormId = formId ?? "new";
  const [editorState, setEditorState] = useState<FormEditorState>(() =>
    createFormEditorState(currentFormId),
  );

  useEffect(() => {
    document.title = "Edit Form — Studio";
  }, []);

  useEffect(() => {
    setEditorState(createFormEditorState(currentFormId));
  }, [currentFormId]);

  const displayTitle =
    typeof editorState.form.title === "string" && editorState.form.title.trim()
      ? editorState.form.title
      : "Untitled Form";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
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
            className="h-auto max-w-xl border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator status={editorState.status} />
          <Button type="button">Save</Button>
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

        <TabsContent value="edit" className="min-h-0 overflow-y-auto p-6">
          <FormBuilder
            form={editorState.form}
            onChange={(nextForm) => {
              setEditorState((current) => ({
                ...current,
                form: nextForm,
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="preview" className="min-h-0 overflow-y-auto p-6">
          <PlaceholderPanel>Form preview goes here</PlaceholderPanel>
        </TabsContent>

        <TabsContent value="share" className="min-h-0 overflow-y-auto p-6">
          <PlaceholderPanel>Share options go here</PlaceholderPanel>
        </TabsContent>

        <TabsContent value="results" className="min-h-0 overflow-y-auto p-6">
          <PlaceholderPanel>Results table goes here</PlaceholderPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
