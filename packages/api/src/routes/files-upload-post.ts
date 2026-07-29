import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import {
  detectFileContentType,
  getContainer,
  isSafeRasterImage,
  verifyCapabilityToken,
} from '../core';
import { enforceRateLimit } from '../middleware';

export const FILES_UPLOAD_POST: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const formId = String(request.headers['x-form-id'] || '');
    const fieldId = String(request.headers['x-field-id'] || '');
    const token =
      request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1] ?? '';
    const capability = verifyCapabilityToken(token, 'upload', formId);

    if (!formId || !fieldId || !capability || capability.sub !== formId) {
      reply.status(401).send({
        error: {
          code: 'INVALID_UPLOAD_CAPABILITY',
          message: 'A valid upload capability is required.',
        },
      });
      return;
    }

    if (
      !enforceRateLimit(request, reply, 'upload-ip', 40, 60 * 60_000) ||
      !enforceRateLimit(request, reply, `upload:${formId}`, 20, 60 * 60_000)
    ) {
      return;
    }

    const { fileService, formService } = await getContainer();
    const form = await formService.findForRenderingById(formId);
    const field = form?.sections
      ?.flatMap((section) => section.fields ?? [])
      .find((candidate) => candidate.id === fieldId);
    if (
      !field ||
      !['camera', 'file_upload', 'signature'].includes(field.type || '')
    ) {
      reply.status(422).send({
        error: {
          code: 'INVALID_UPLOAD_FIELD',
          message: 'The upload field is not part of this form.',
        },
      });
      return;
    }

    const file = await request.file();

    if (!file) {
      reply.status(400).send();

      return;
    }

    const buffer = await file.toBuffer();
    const detectedContentType = detectFileContentType(buffer);

    if (
      field.type === 'file_upload' &&
      field.accepted_mime_types &&
      !field.accepted_mime_types.some((acceptedType) =>
        acceptedType.endsWith('/*')
          ? detectedContentType?.startsWith(acceptedType.slice(0, -1))
          : detectedContentType === acceptedType,
      )
    ) {
      reply.status(422).send({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'The uploaded file type is not accepted by this field.',
        },
      });
      return;
    }

    if (
      (field.type === 'camera' || field.type === 'signature') &&
      !isSafeRasterImage(detectedContentType)
    ) {
      reply.status(422).send({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'This field accepts only supported raster images.',
        },
      });
      return;
    }

    const url = await fileService.upload(
      formId,
      buffer,
      file.filename,
      detectedContentType || 'application/octet-stream',
    );

    reply.status(200).send({ url });
  },
  method: 'POST',
  url: '/api/v1/files/upload',
};
