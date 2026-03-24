export type ValidationMessages = {
  required: string;
  invalid: string;
  min_length: string;
  max_length: string;
  date_min: string;
  date_max: string;
  whole_number: string;
  number_min: string;
  number_max: string;
  file_min: string;
  file_max: string;
  selection_min: string;
  selection_max: string;
};

export const DEFAULT_MESSAGES: ValidationMessages = {
  required: "{{label}} is required.",
  invalid: "{{label}} is invalid.",
  min_length: "{{label}} must be at least {{min}} characters.",
  max_length: "{{label}} must be at most {{max}} characters.",
  date_min: "{{label}} must be on or after {{min}}.",
  date_max: "{{label}} must be on or before {{max}}.",
  whole_number: "{{label}} must be a whole number.",
  number_min: "{{label}} must be at least {{min}}.",
  number_max: "{{label}} must be at most {{max}}.",
  file_min: "{{label}} requires at least {{min}} file(s).",
  file_max: "{{label}} allows at most {{max}} file(s).",
  selection_min: "{{label}} requires at least {{min}} selection(s).",
  selection_max: "{{label}} allows at most {{max}} selection(s).",
};
