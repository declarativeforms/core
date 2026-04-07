import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Building2,
  Calendar,
  Camera,
  Clock3,
  Crosshair,
  ChevronDown,
  FileUp,
  Globe,
  Hash,
  Link2,
  ListChecks,
  Map,
  Mail,
  MapPin,
  PenSquare,
  Phone,
  ShieldCheck,
  Star,
  Type,
  EyeOff,
} from "lucide-react";

import type {
  DeclarativeFieldType,
  IDeclarativeFormField,
  IDeclarativeFormOption,
} from "@declarativeforms/types";
import { getLocalizedTextPreview } from "@/lib/localized-text";

export const BUILDER_FIELD_TYPES = [
  "address",
  "address_country",
  "address_locality",
  "address_region",
  "camera",
  "short_text",
  "long_text",
  "email",
  "number",
  "date",
  "date_month",
  "dropdown",
  "geolocation",
  "hidden",
  "single_select",
  "multiple_select",
  "rating",
  "file_upload",
  "signature",
  "time",
  "turnstile",
  "url",
  "mobile_number",
] as const satisfies readonly DeclarativeFieldType[];

export type SupportedFieldType = (typeof BUILDER_FIELD_TYPES)[number];

const supportedFieldTypeSet = new Set<SupportedFieldType>([
  ...BUILDER_FIELD_TYPES,
]);

const fieldTypeLabels: Record<SupportedFieldType, string> = {
  address: "Address",
  address_country: "Country",
  address_locality: "City",
  address_region: "Region",
  camera: "Camera",
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  number: "Number",
  date: "Date",
  date_month: "Month",
  dropdown: "Dropdown",
  geolocation: "Geolocation",
  hidden: "Hidden",
  single_select: "Single Select",
  multiple_select: "Multiple Select",
  rating: "Rating",
  file_upload: "File Upload",
  signature: "Signature",
  time: "Time",
  turnstile: "Turnstile",
  url: "URL",
  mobile_number: "Mobile Number",
};

const fieldTypeIcons: Record<SupportedFieldType, LucideIcon> = {
  address: MapPin,
  address_country: Globe,
  address_locality: Building2,
  address_region: Map,
  camera: Camera,
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  number: Hash,
  date: Calendar,
  date_month: Calendar,
  dropdown: ChevronDown,
  geolocation: Crosshair,
  hidden: EyeOff,
  single_select: ChevronDown,
  multiple_select: ListChecks,
  rating: Star,
  file_upload: FileUp,
  signature: PenSquare,
  time: Clock3,
  turnstile: ShieldCheck,
  url: Link2,
  mobile_number: Phone,
};

export function isSupportedFieldType(
  value: DeclarativeFieldType | undefined,
): value is SupportedFieldType {
  return !!value && supportedFieldTypeSet.has(value as SupportedFieldType);
}

export function isChoiceFieldType(
  value: DeclarativeFieldType | undefined,
): value is "dropdown" | "single_select" | "multiple_select" {
  return (
    value === "dropdown" ||
    value === "single_select" ||
    value === "multiple_select"
  );
}

export function getFieldTypeLabel(type: SupportedFieldType | undefined) {
  return fieldTypeLabels[type ?? "short_text"];
}

export function getFieldTypeIcon(type: SupportedFieldType | undefined) {
  return fieldTypeIcons[type ?? "short_text"];
}

export function getEditableFieldType(field: IDeclarativeFormField) {
  return isSupportedFieldType(field.type) ? field.type : "short_text";
}

export function getFieldDisplayLabel(field: IDeclarativeFormField) {
  const label = getLocalizedTextPreview(field.label);
  return label.trim() ? label : "Untitled Field";
}

export function getSectionDisplayTitle(title: unknown) {
  if (typeof title === "string") {
    return title.trim() ? title : "Untitled Section";
  }

  const localizedTitle = getLocalizedTextPreview(title as never);
  return localizedTitle.trim() ? localizedTitle : "Untitled Section";
}

export function getOptionStrings(options?: Array<IDeclarativeFormOption>) {
  return (options ?? []).map((option) => {
    if (typeof option === "string") {
      return option;
    }

    const localizedLabel = getLocalizedTextPreview(option.label);

    if (localizedLabel.trim()) {
      return localizedLabel;
    }

    return option.value ?? "";
  });
}

export function createDefaultField(type: SupportedFieldType, id: string) {
  const baseField = {
    id,
    type,
    label: "Untitled Field",
    placeholder: "",
    validators: [],
  };

  switch (type) {
    case "dropdown":
      return {
        ...baseField,
        searchable: false,
        options: ["Option 1", "Option 2"],
      } as IDeclarativeFormField;

    case "single_select":
    case "multiple_select":
      return {
        ...baseField,
        allow_other: false,
        options: ["Option 1", "Option 2"],
      } as IDeclarativeFormField;

    case "email":
      return {
        ...baseField,
        otp: false,
        block_free_email: false,
      } as IDeclarativeFormField;

    case "rating":
      return {
        ...baseField,
        min_label: "",
        max_label: "",
      } as IDeclarativeFormField;

    case "address":
    case "address_country":
    case "address_locality":
    case "address_region":
      return {
        ...baseField,
        outputFormat: "string",
      } as IDeclarativeFormField;

    case "camera":
      return {
        ...baseField,
        facing_mode: "rear",
      } as IDeclarativeFormField;

    default:
      return baseField as IDeclarativeFormField;
  }
}
