import { FORM_JSON_SCHEMA } from '@declarativeforms/engine';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ strict: false, allErrors: true, ownProperties: true });
addFormats(ajv);
const validate = ajv.compile(FORM_JSON_SCHEMA);

export function validateDefinition(definition: unknown): Array<ErrorObject> {
  validate(definition);

  return validate.errors ?? [];
}
