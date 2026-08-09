import type { ComponentType } from "react";

import type { IRenderableField } from "@declarativeforms/engine";

import type { Translate } from "@/i18n";
import {
  AddressField,
  CameraField,
  DropdownField,
  EmailField,
  FileUploadField,
  GeolocationField,
  HiddenField,
  InputField,
  LongTextField,
  MultipleSelectField,
  RatingField,
  SignatureField,
  SingleSelectField,
} from "../fields";
import { getEmailValidators } from "../fields/email/validation";
import type { DeclarativeFieldComponentProps } from "../supporting/field-support.types";

/**
 * Everything the form engine needs to know about a field type in one place: the
 * component that renders it and any extra client-only validators it contributes.
 * Adding a field type is a single entry here plus its component.
 */
type FieldRegistryEntry = {
  component: ComponentType<DeclarativeFieldComponentProps>;
  validate?: (
    field: IRenderableField,
    t: Translate,
  ) => Record<string, any> | undefined;
};

export const fieldRegistry = {
  address: { component: AddressField },
  address_country: { component: AddressField },
  address_locality: { component: AddressField },
  address_region: { component: AddressField },
  camera: { component: CameraField },
  date: { component: InputField },
  date_month: { component: InputField },
  dropdown: { component: DropdownField },
  email: { component: EmailField, validate: getEmailValidators },
  geolocation: { component: GeolocationField },
  file_upload: { component: FileUploadField },
  hidden: { component: HiddenField },
  long_text: { component: LongTextField },
  mobile_number: { component: InputField },
  multiple_select: { component: MultipleSelectField },
  number: { component: InputField },
  rating: { component: RatingField },
  short_text: { component: InputField },
  signature: { component: SignatureField },
  single_select: { component: SingleSelectField },
  time: { component: InputField },
  url: { component: InputField },
} as Record<IRenderableField["type"], FieldRegistryEntry>;
