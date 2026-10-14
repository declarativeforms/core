import Ajv, { type AnySchema } from 'ajv';
import type {
  RouteOptions,
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
} from 'fastify';
import { getContainer } from '../core';
import { ADAPTIVE_FIELDS_SCHEMA } from '../core/services/adaptive-validation';
import type { IAdaptiveTurn } from '../core/types/adaptive';

const ajv = new Ajv({ strict: false, ownProperties: true }).addSchema(
  ADAPTIVE_FIELDS_SCHEMA,
);

export const FORMS_ID_SECTIONS_SECTION_ID_ADAPTIVE_POST: RouteOptions<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  {
    Params: { id: string; sectionId: string };
    Body: {
      locale: string;
      data: Record<string, unknown>;
      history: Array<IAdaptiveTurn>;
    };
  }
> = {
  method: 'POST',
  url: '/api/v1/forms/:id/sections/:sectionId/adaptive',
  bodyLimit: 1024 * 1024,
  config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  validatorCompiler: (request) => ajv.compile(request.schema as AnySchema),
  schema: {
    params: {
      type: 'object',
      required: ['id', 'sectionId'],
      properties: {
        id: { type: 'string', minLength: 1 },
        sectionId: { type: 'string', pattern: '^[A-Za-z_][A-Za-z0-9_]*$' },
      },
    },
    body: {
      type: 'object',
      additionalProperties: true,
      required: ['locale', 'data', 'history'],
      properties: {
        locale: { type: 'string', minLength: 2, maxLength: 20 },
        data: { type: 'object' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
            required: ['fields', 'answers'],
            properties: {
              fields: { $ref: ADAPTIVE_FIELDS_SCHEMA.$id },
              answers: { type: 'object' },
            },
          },
        },
      },
    },
  },
  handler: async (request, reply) => {
    const container = await getContainer();
    const assessment = await container.adaptiveService.assess(
      request.params.id,
      request.params.sectionId,
      {
        locale: request.body.locale,
        data: request.body.data,
        history: request.body.history.map((turn) => ({
          fields: turn.fields,
          answers: turn.answers,
        })),
      },
    );

    return reply
      .header('Cache-Control', 'no-store')
      .status(assessment ? 200 : 404)
      .send(assessment);
  },
};
