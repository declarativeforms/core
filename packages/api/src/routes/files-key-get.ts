import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';
import { sendNotFound } from './error-response';

export const FILES_KEY_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Params: { '*': string } }>,
    reply: FastifyReply,
  ) => {
    const { fileService } = await getContainer();
    const file = await fileService.download(request.params['*']);

    if (!file) {
      sendNotFound(reply, 'File');
      return;
    }

    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    reply.type(file.contentType).status(200).send(file.body);
  },
  method: 'GET',
  url: '/api/v1/files/*',
};
