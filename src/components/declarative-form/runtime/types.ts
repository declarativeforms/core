import type { IDeclarativeForm } from "../types";

// --- Validation Rules (extensible discriminated union) ---

export type ValidationRule =
  | { type: "required"; message: string }
  | { type: "pattern"; regex: string; message: string }
  | { type: "min_length"; value: number; message: string }
  | { type: "max_length"; value: number; message: string }
  | { type: "min"; value: number | string; message: string }
  | { type: "max"; value: number | string; message: string };

// --- Compiled Form ---

export type CompiledOption = {
  label: string;
  value: string;
};

type CompiledFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  visible: boolean;
  visible_when?: string;
  validation: ValidationRule[];
};

export type CompiledEmailField = CompiledFieldBase & {
  type: "email";
  otp?: boolean;
};

export type CompiledDropdownField = CompiledFieldBase & {
  type: "dropdown";
  searchable?: boolean;
  options?: CompiledOption[];
};

export type CompiledRatingField = CompiledFieldBase & {
  type: "rating";
  min_label?: string;
  max_label?: string;
};

export type CompiledAddressField = CompiledFieldBase & {
  type: "address" | "address_locality" | "address_region" | "address_country";
  outputFormat?: string;
};

export type CompiledSelectField = CompiledFieldBase & {
  type: "single_select" | "multiple_select";
  options?: CompiledOption[];
};

export type CompiledGeolocationField = CompiledFieldBase & {
  type: "geolocation";
};

export type CompiledGenericField = CompiledFieldBase & {
  type:
    | "date"
    | "file_upload"
    | "hidden"
    | "long_text"
    | "mobile_number"
    | "number"
    | "signature"
    | "short_text"
    | "url";
};

export type CompiledField =
  | CompiledEmailField
  | CompiledDropdownField
  | CompiledRatingField
  | CompiledAddressField
  | CompiledSelectField
  | CompiledGeolocationField
  | CompiledGenericField;

export type CompiledSection = {
  id: string;
  title: string;
  fields: CompiledField[];
};

export type CompiledCompletion = {
  title?: string;
  message?: string;
  button?: { label: string; url: string };
};

export type CompiledForm = {
  id?: string;
  version: number;
  title: string;
  description?: string;
  activeSectionId: string;
  sections: CompiledSection[];
  completion?: CompiledCompletion;
  connections: IDeclarativeForm["connections"];
  locale: string;
  mixpanel?: string;
  start_date?: string;
  end_date?: string;
};

// --- Form State ---

export type FormState = {
  compiled: CompiledForm;
  data: Record<string, unknown>;
  activeSectionId: string;
  sectionHistory: string[];
  validationErrors: Record<string, string>;
};

// --- Actions ---

export type FormAction =
  | { type: "update_field"; fieldId: string; value: unknown }
  | { type: "submit_section"; data: Record<string, unknown> }
  | { type: "go_back" }
  | { type: "set_locale"; locale: string };

// --- Effects (signals to IO layer) ---

export type FormEffect =
  | { type: "none" }
  | { type: "submit"; data: Record<string, unknown>; isPartial: boolean }
  | { type: "complete"; data: Record<string, unknown> }
  | { type: "redirect"; url: string };

export type DispatchResult = {
  state: FormState;
  effect: FormEffect;
};
