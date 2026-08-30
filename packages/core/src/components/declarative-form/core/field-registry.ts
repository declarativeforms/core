'use client';

import type { ComponentType } from 'react';

import type { IRenderableField } from '@declarativeforms/engine';

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
} from '../fields';
import type { DeclarativeFieldComponentProps } from '../supporting/field-support.types';

type DeclarativeFieldRenderer = ComponentType<DeclarativeFieldComponentProps>;

export const fieldRegistry = {
  address: AddressField,
  address_country: AddressField,
  address_locality: AddressField,
  address_region: AddressField,
  camera: CameraField,
  date: InputField,
  date_month: InputField,
  dropdown: DropdownField,
  email: EmailField,
  geolocation: GeolocationField,
  file_upload: FileUploadField,
  hidden: HiddenField,
  long_text: LongTextField,
  mobile_number: InputField,
  multiple_select: MultipleSelectField,
  number: InputField,
  rating: RatingField,
  short_text: InputField,
  signature: SignatureField,
  single_select: SingleSelectField,
  time: InputField,
  url: InputField,
} as Record<IRenderableField['type'], DeclarativeFieldRenderer>;
