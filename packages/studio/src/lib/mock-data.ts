import type { IDeclarativeForm } from "@/lib/declarative-form-types";

export type StudioSubmissionStatus = "completed" | "partial";

export type StudioFormRecord = {
  id: string;
  form: IDeclarativeForm;
  createdAt: string;
  updatedAt: string;
};

export type StudioSubmissionRecord = {
  id: string;
  formId: string;
  submittedAt: string;
  status: StudioSubmissionStatus;
  values: Record<string, unknown>;
};

export type StudioFormListItem = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  responseCount: number;
};

const FORMS_STORAGE_KEY = "studio.forms";
const SUBMISSIONS_STORAGE_KEY = "studio.submissions";

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

let formsCache: StudioFormRecord[] | null = null;
let submissionsCache: StudioSubmissionRecord[] | null = null;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getTextValue(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const firstValue = Object.values(value as Record<string, unknown>).find(
      (entry) => typeof entry === "string" && entry.trim(),
    );

    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return fallback;
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "form";
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function createSeedFormRecord(input: {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
}): StudioFormRecord {
  return {
    id: input.id,
    createdAt: input.updatedAt,
    updatedAt: input.updatedAt,
    form: {
      ...cloneValue(defaultFormTemplate),
      id: input.id,
      title: input.title,
      description: input.description,
    },
  };
}

function createSeedForms(): StudioFormRecord[] {
  return [
    createSeedFormRecord({
      id: "customer-feedback",
      title: "Customer Feedback Survey",
      description:
        "Capture structured product feedback from recent customers after onboarding and major feature releases.",
      updatedAt: "2026-03-28T09:30:00.000Z",
    }),
    createSeedFormRecord({
      id: "event-registration",
      title: "Spring Event Registration",
      description:
        "Collect attendee details, accessibility requirements, and session preferences for the upcoming studio launch event.",
      updatedAt: "2026-03-30T07:45:00.000Z",
    }),
    createSeedFormRecord({
      id: "support-intake",
      title: "Support Request Intake",
      description:
        "Route support submissions with priority context, account references, and reproduction details for triage.",
      updatedAt: "2026-03-24T13:15:00.000Z",
    }),
    createSeedFormRecord({
      id: "job-application",
      title: "Frontend Role Application",
      description:
        "Gather candidate experience, portfolio links, and screening responses for the studio hiring pipeline.",
      updatedAt: "2026-03-18T11:10:00.000Z",
    }),
  ];
}

function createSeedSubmissions(): StudioSubmissionRecord[] {
  return [
    {
      id: "sub_01f05c90f2",
      formId: "customer-feedback",
      submittedAt: "2026-03-30T08:45:00.000Z",
      status: "completed",
      values: {
        first_name: "Ava",
        last_name: "Johnson",
        email: "ava.johnson@example.com",
      },
    },
    {
      id: "sub_0281a9d2ce",
      formId: "customer-feedback",
      submittedAt: "2026-03-29T14:12:00.000Z",
      status: "completed",
      values: {
        first_name: "Ethan",
        last_name: "Wright",
        email: "ethan.wright@example.com",
      },
    },
    {
      id: "sub_03c9b1e74a",
      formId: "customer-feedback",
      submittedAt: "2026-03-28T16:30:00.000Z",
      status: "partial",
      values: {
        first_name: "Maya",
        last_name: "Patel",
        email: "maya.patel@example.com",
      },
    },
    {
      id: "sub_04577db821",
      formId: "support-intake",
      submittedAt: "2026-03-27T10:05:00.000Z",
      status: "completed",
      values: {
        first_name: "Leo",
        last_name: "Martinez",
        email: "leo.martinez@example.com",
      },
    },
    {
      id: "sub_05691be2dc",
      formId: "support-intake",
      submittedAt: "2026-03-26T18:40:00.000Z",
      status: "completed",
      values: {
        first_name: "Sophia",
        last_name: "Kim",
        email: "sophia.kim@example.com",
      },
    },
    {
      id: "sub_06ab9df403",
      formId: "support-intake",
      submittedAt: "2026-03-25T09:22:00.000Z",
      status: "partial",
      values: {
        first_name: "Noah",
        last_name: "Brown",
        email: "noah.brown@example.com",
      },
    },
    {
      id: "sub_07c0f99a4d",
      formId: "job-application",
      submittedAt: "2026-03-23T12:15:00.000Z",
      status: "completed",
      values: {
        first_name: "Emma",
        last_name: "Davis",
        email: "emma.davis@example.com",
      },
    },
    {
      id: "sub_08de4471aa",
      formId: "job-application",
      submittedAt: "2026-03-20T08:55:00.000Z",
      status: "completed",
      values: {
        first_name: "Liam",
        last_name: "Wilson",
        email: "liam.wilson@example.com",
      },
    },
  ];
}

function ensureFormsStore() {
  if (formsCache) {
    return formsCache;
  }

  formsCache = readStorage<StudioFormRecord[]>(FORMS_STORAGE_KEY) ?? createSeedForms();
  return formsCache;
}

function ensureSubmissionsStore() {
  if (submissionsCache) {
    return submissionsCache;
  }

  submissionsCache =
    readStorage<StudioSubmissionRecord[]>(SUBMISSIONS_STORAGE_KEY) ??
    createSeedSubmissions();
  return submissionsCache;
}

function persistForms(forms: StudioFormRecord[]) {
  formsCache = forms;
  writeStorage(FORMS_STORAGE_KEY, forms);
}

function persistSubmissions(submissions: StudioSubmissionRecord[]) {
  submissionsCache = submissions;
  writeStorage(SUBMISSIONS_STORAGE_KEY, submissions);
}

function buildListItem(formRecord: StudioFormRecord): StudioFormListItem {
  const responseCount = ensureSubmissionsStore().filter(
    (submission) => submission.formId === formRecord.id,
  ).length;

  return {
    id: formRecord.id,
    title: getTextValue(formRecord.form.title, "Untitled Form"),
    description: getTextValue(formRecord.form.description, ""),
    updatedAt: formRecord.updatedAt,
    responseCount,
  };
}

export function createEmptyFormDefinition() {
  return cloneValue(defaultFormTemplate);
}

export function listForms(): StudioFormListItem[] {
  return ensureFormsStore()
    .map(buildListItem)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getForm(formId: string): StudioFormRecord | null {
  const record = ensureFormsStore().find((entry) => entry.id === formId);
  return record ? cloneValue(record) : null;
}

export function saveForm(form: IDeclarativeForm): StudioFormRecord {
  const nextId = getTextValue(form.id).trim();

  if (!nextId) {
    throw new Error("Form ID is required to persist a form.");
  }

  const forms = ensureFormsStore();
  const now = new Date().toISOString();
  const existing = forms.find((entry) => entry.id === nextId);
  const nextRecord: StudioFormRecord = {
    id: nextId,
    form: cloneValue({
      ...form,
      id: nextId,
    }),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  persistForms(
    existing
      ? forms.map((entry) => (entry.id === nextId ? nextRecord : entry))
      : [...forms, nextRecord],
  );

  return cloneValue(nextRecord);
}

export function createForm() {
  const now = new Date().toISOString();
  const baseForm = createEmptyFormDefinition();
  const existingIds = new Set(ensureFormsStore().map((entry) => entry.id));
  const baseSlug = slugify(getTextValue(baseForm.title, "untitled-form"));
  let index = 1;
  let nextId = baseSlug;

  while (existingIds.has(nextId)) {
    index += 1;
    nextId = `${baseSlug}-${index}`;
  }

  const nextRecord: StudioFormRecord = {
    id: nextId,
    createdAt: now,
    updatedAt: now,
    form: {
      ...baseForm,
      id: nextId,
    },
  };

  persistForms([...ensureFormsStore(), nextRecord]);

  return cloneValue(nextRecord);
}

export function ensureForm(formId: string) {
  const existing = getForm(formId);

  if (existing) {
    return existing;
  }

  const nextRecord: StudioFormRecord = {
    id: formId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    form: {
      ...createEmptyFormDefinition(),
      id: formId,
    },
  };

  persistForms([...ensureFormsStore(), nextRecord]);

  return cloneValue(nextRecord);
}

export function listSubmissions(formId: string) {
  return ensureSubmissionsStore()
    .filter((submission) => submission.formId === formId)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
    .map((submission) => cloneValue(submission));
}

export function replaceSubmissions(submissions: StudioSubmissionRecord[]) {
  persistSubmissions(cloneValue(submissions));
}
