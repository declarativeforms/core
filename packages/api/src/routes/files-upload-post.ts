import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FILES_UPLOAD_POST: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      reply.status(400).send();

      return;
    }

    const buffer = await data.toBuffer();

    const { fileService } = await getContainer();
    const url: string = await fileService.upload(buffer, data.filename, data.mimetype);

    reply.status(200).send({ url });
  },
  method: 'POST',
  url: '/api/v1/files/upload',
};
