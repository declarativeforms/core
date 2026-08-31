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
  TextField,
} from '../fields';
import type { FieldProps } from '../supporting/field.types';

type DeclarativeFieldRenderer = ComponentType<FieldProps>;

/**
 * Erase a field's narrow prop types so it can sit in the registry.
 *
 * Props are contravariant, so a component declared for one field type is not
 * assignable to the union-typed slot. The key it is registered under is what
 * guarantees the runtime match, and this keeps the cast to a single place
 * instead of one per entry.
 */
function renderer<TField extends IRenderableField, TValue>(
  component: ComponentType<FieldProps<TField, TValue>>,
): DeclarativeFieldRenderer {
  return component as DeclarativeFieldRenderer;
}

/**
 * Annotated rather than asserted (`as Record<...>`), so a field type added to
 * the engine fails the build here until it has a renderer.
 */
export const fieldRegistry: Record<
  DeclarativeFieldType,
  DeclarativeFieldRenderer
> = {
  address: renderer(AddressField),
  address_country: renderer(AddressField),
  address_locality: renderer(AddressField),
  address_region: renderer(AddressField),
  camera: renderer(CameraField),
  date: renderer(DateField),
  date_month: renderer(DateField),
  dropdown: renderer(DropdownField),
  email: renderer(EmailField),
  file_upload: renderer(FileUploadField),
  geolocation: renderer(GeolocationField),
  hidden: renderer(HiddenField),
  long_text: renderer(LongTextField),
  mobile_number: renderer(TextField),
  multiple_select: renderer(MultipleSelectField),
  number: renderer(NumberField),
  rating: renderer(RatingField),
  short_text: renderer(TextField),
  signature: renderer(SignatureField),
  single_select: renderer(SingleSelectField),
  time: renderer(DateField),
  url: renderer(TextField),
};
