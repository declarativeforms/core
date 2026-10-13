export type IAdaptiveProperty = {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: Array<string | number | boolean>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  items?: IAdaptiveProperty;
  properties?: Record<string, IAdaptiveProperty>;
  required?: Array<string>;
  additionalProperties?: false;
};
