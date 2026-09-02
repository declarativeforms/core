import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FILES_UPLOAD_POST: RouteOptions<any, any, any, any> = {
  config: {
    rateLimit: {
      max: 20,
      timeWindow: '1 hour',
    },
  },
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();

    if (!file) {
      reply.status(400).send();

      return;
    }

    const { fileService } = await getContainer();

    const buffer = await file.toBuffer();

    const url = await fileService.upload(buffer, file.filename, file.mimetype);

    reply.status(200).send({ url });
  },
  method: 'POST',
  url: '/api/v1/files/upload',
};
