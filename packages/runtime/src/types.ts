import type {
  DeclarativeFieldType,
  IConnection,
} from '@declarativeforms/types';

export type ValidationRule =
  | { type: 'required'; message: string }
  | { type: 'pattern'; regex: string; message: string }
  | { type: 'min_length'; value: number; message: string }
  | { type: 'max_length'; value: number; message: string }
  | { type: 'min'; value: number | string; message: string }
  | { type: 'max'; value: number | string; message: string }
  | { type: 'expression'; expression: string; message: string };

export type CompiledOption = {
  label: string;
  value: string;
};

type CompiledFieldBase = {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  visible: boolean;
  visible_when?: string;
  validation: ValidationRule[];
};

export type CompiledEmailField = CompiledFieldBase & {
  type: 'email';
  block_free_email?: boolean;
};

export type CompiledDropdownField = CompiledFieldBase & {
  type: 'dropdown';
  searchable?: boolean;
  options?: CompiledOption[];
};

export type CompiledRatingField = CompiledFieldBase & {
  type: 'rating';
  min_label?: string;
  max_label?: string;
};

export type CompiledAddressField = CompiledFieldBase & {
  type: 'address' | 'address_locality' | 'address_region' | 'address_country';
  outputFormat?: string;
};

export type CompiledSelectField = CompiledFieldBase & {
  type: 'single_select' | 'multiple_select';
  options?: CompiledOption[];
  allow_other?: boolean;
};

export type CompiledGeolocationField = CompiledFieldBase & {
  type: 'geolocation';
};

export type CompiledCameraField = CompiledFieldBase & {
  type: 'camera';
  facing_mode?: 'front' | 'rear';
};

export type CompiledFileUploadField = CompiledFieldBase & {
  type: 'file_upload';
  accepted_mime_types?: string[];
};

export type CompiledGenericField = CompiledFieldBase & {
  type: Extract<
    DeclarativeFieldType,
    | 'date'
    | 'date_month'
    | 'hidden'
    | 'long_text'
    | 'mobile_number'
    | 'number'
    | 'signature'
    | 'short_text'
    | 'time'
    | 'url'
  >;
};

export type CompiledField =
  | CompiledEmailField
  | CompiledDropdownField
  | CompiledRatingField
  | CompiledAddressField
  | CompiledSelectField
  | CompiledGeolocationField
  | CompiledCameraField
  | CompiledFileUploadField
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
  connections: IConnection[];
  locale: string;
  measurements?: { mixpanel?: string };
  start_date?: string;
  end_date?: string;
  theme?: { primary?: string };
};

export type FormState = {
  compiled: CompiledForm;
  data: Record<string, unknown>;
  activeSectionId: string;
  sectionHistory: string[];
  validationErrors: Record<string, string>;
};

export type FormAction =
  | { type: 'update_field'; fieldId: string; value: unknown }
  | { type: 'submit_section'; data: Record<string, unknown> }
  | { type: 'go_back' }
  | { type: 'set_locale'; locale: string };

export type FormEffect =
  | { type: 'none' }
  | { type: 'submit'; data: Record<string, unknown>; isPartial: boolean }
  | { type: 'complete'; data: Record<string, unknown> }
  | { type: 'redirect'; url: string };

export type DispatchResult = {
  state: FormState;
  effect: FormEffect;
};
