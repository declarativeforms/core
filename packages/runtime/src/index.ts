// High-level API
export { createFormRuntime } from "./create-form-runtime";
export type { FormRuntime, FormRuntimeOptions } from "./create-form-runtime";

// State machine primitives
export { createRuntimeState, transitionRuntime } from "./core/runtime";

// Compilation
export { compile } from "./compilation/form";
export { compileField, resolveFieldVisibility } from "./compilation/field";
export { buildDefaultValues } from "./compilation/defaults";

// Validation
export {
  buildValidationRules,
  validateFieldValue,
  validateSectionData,
  findValidationRule,
  getNumericRuleValue,
  getNumericBound,
  getFieldOptions,
  getRatingRange,
  buildFieldMetadata,
} from "./validation";
export type {
  RatingRange,
  FieldValidator,
  FieldValidationConfig,
  FieldMetadata,
} from "./validation";

// Navigation & Completion
export { resolveNextSectionId, isExternalNextSectionId } from "./core/navigation";
export { resolveCompletion } from "./core/completion";
export { localizeCompletion } from "./localization";

// Messages
export { DEFAULT_MESSAGES, interpolate } from "./messages";
export type { ValidationMessages } from "./messages";

// Types
export type {
  ValidationRule,
  CompiledOption,
  CompiledEmailField,
  CompiledDropdownField,
  CompiledRatingField,
  CompiledAddressField,
  CompiledSelectField,
  CompiledGeolocationField,
  CompiledCameraField,
  CompiledTurnstileField,
  CompiledGenericField,
  CompiledField,
  CompiledSection,
  CompiledCompletion,
  CompiledForm,
  FormState,
  FormAction,
  FormEffect,
  DispatchResult,
} from "./types";
