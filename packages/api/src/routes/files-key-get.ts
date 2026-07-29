import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import {
  detectFileContentType,
  getContainer,
  isSafeRasterImage,
} from '../core';
import { sendNotFound } from './error-response';
import { enforceRateLimit } from '../middleware';

export const FILES_KEY_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Params: { '*': string } }>,
    reply: FastifyReply,
  ) => {
    if (!enforceRateLimit(request, reply, 'file-read', 300, 60_000)) {
      return;
    }
    const { fileService } = await getContainer();
    const file = await fileService.download(request.params['*']);

    if (!file) {
      sendNotFound(reply, 'File');
      return;
    }

    const filename = request.params['*'].split('/').pop() || 'download';
    reply.header('Cache-Control', 'private, max-age=3600');
    const detectedContentType = detectFileContentType(file.body);
    const safeImageType = isSafeRasterImage(detectedContentType)
      ? detectedContentType
      : null;
    reply.header(
      'Content-Disposition',
      `${safeImageType ? 'inline' : 'attachment'}; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    );
    reply.header('Content-Security-Policy', "default-src 'none'; sandbox");
    reply.header('X-Content-Type-Options', 'nosniff');
    reply
      .type(safeImageType || 'application/octet-stream')
      .status(200)
      .send(file.body);
  },
  method: 'GET',
  url: '/api/v1/files/*',
};
