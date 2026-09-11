'use client';
import type { ComponentType } from 'react';
import type {
  DeclarativeFieldType,
  IRenderableField,
} from '@declarativeforms/engine';
import {
  AddressField,
  CameraField,
  DateField,
  DropdownField,
  EmailField,
  FileUploadField,
  GeolocationField,
  HiddenField,
  LongTextField,
  MultipleSelectField,
  NumberField,
  RatingField,
  SignatureField,
  SingleSelectField,
  TextBlockField,
  TextField,
  TurnstileField,
} from '@/components/declarative-form/fields';
import { type FieldProps } from '@/components/declarative-form/supporting';

type DeclarativeFieldRenderer = ComponentType<FieldProps>;

function toFieldRenderer<TField extends IRenderableField, TValue>(
  component: ComponentType<FieldProps<TField, TValue>>,
): DeclarativeFieldRenderer {
  return component as DeclarativeFieldRenderer;
}

export const fieldRegistry: Record<
  DeclarativeFieldType,
  DeclarativeFieldRenderer
> = {
  address: toFieldRenderer(AddressField),
  address_country: toFieldRenderer(AddressField),
  address_locality: toFieldRenderer(AddressField),
  address_region: toFieldRenderer(AddressField),
  camera: toFieldRenderer(CameraField),
  date: toFieldRenderer(DateField),
  date_month: toFieldRenderer(DateField),
  dropdown: toFieldRenderer(DropdownField),
  email: toFieldRenderer(EmailField),
  file_upload: toFieldRenderer(FileUploadField),
  geolocation: toFieldRenderer(GeolocationField),
  hidden: toFieldRenderer(HiddenField),
  long_text: toFieldRenderer(LongTextField),
  mobile_number: toFieldRenderer(TextField),
  multiple_select: toFieldRenderer(MultipleSelectField),
  number: toFieldRenderer(NumberField),
  rating: toFieldRenderer(RatingField),
  short_text: toFieldRenderer(TextField),
  signature: toFieldRenderer(SignatureField),
  single_select: toFieldRenderer(SingleSelectField),
  text_block: toFieldRenderer(TextBlockField),
  time: toFieldRenderer(DateField),
  turnstile: toFieldRenderer(TurnstileField),
  url: toFieldRenderer(TextField),
};
