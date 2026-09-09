import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FILES_KEY_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { '*': string };
    }>,
    reply: FastifyReply,
  ) => {
    const key = request.params['*'];

    if (!key) {
      reply.status(404).send();

      return;
    }

    const { fileService } = await getContainer();
    const file = await fileService.download(key);

    if (!file) {
      reply.status(404).send();

      return;
    }

    if (file.contentType) {
      reply.type(file.contentType);
    }

    reply.status(200).send(file.body);
  },
  method: 'GET',
  url: '/api/v1/files/*',
};
