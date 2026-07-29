import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createCapabilityToken, getContainer } from '../core';
import { enforceRateLimit } from '../middleware';

export const FORMS_ID_UPLOAD_CAPABILITIES_POST: RouteOptions<
  any,
  any,
  any,
  any
> = {
  handler: async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        'upload-capability-ip',
        30,
        60 * 60_000,
      ) ||
      !enforceRateLimit(
        request,
        reply,
        `upload-capability:${request.params.id}`,
        10,
        60 * 60_000,
      )
    ) {
      return;
    }

    const { formService } = await getContainer();
    const form = await formService.findForRenderingById(request.params.id);
    const supportsUploads = form?.sections?.some((section) =>
      section.fields?.some((field) =>
        ['camera', 'file_upload', 'signature'].includes(field.type || ''),
      ),
    );

    if (!form || !supportsUploads) {
      reply.status(404).send({
        error: {
          code: 'UPLOAD_NOT_AVAILABLE',
          message: 'This form does not accept file uploads.',
        },
      });
      return;
    }

    reply
      .header('Cache-Control', 'no-store')
      .status(200)
      .send({
        token: createCapabilityToken(
          'upload',
          request.params.id,
          request.params.id,
          '10m',
        ),
      });
  },
  method: 'POST',
  url: '/api/v1/forms/:id/upload-capabilities',
};
