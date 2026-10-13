import type {
  RouteOptions,
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
} from 'fastify';
import { getContainer } from '../core';
import type { IAdaptiveTurn } from '../core/types/adaptive';

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
      additionalProperties: false,
      required: ['locale', 'data', 'history'],
      properties: {
        locale: { type: 'string', minLength: 2, maxLength: 20 },
        data: { type: 'object' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['fields', 'answers'],
            properties: {
              fields: {
                type: 'array',
                maxItems: 50,
                items: { type: 'object' },
              },
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
      request.body,
    );

    return reply
      .header('Cache-Control', 'no-store')
      .status(assessment ? 200 : 404)
      .send(assessment);
  },
};
