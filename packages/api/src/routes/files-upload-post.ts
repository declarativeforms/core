import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { uploadFile } from '../core';

export const FILES_UPLOAD_POST: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      reply.status(400).send();

      return;
    }

    const buffer = await data.toBuffer();

    const url: string = await uploadFile(buffer, data.filename, data.mimetype);

    reply.status(200).send({ url });
  },
  method: 'POST',
  url: '/api/v1/files/upload',
  schema: {
    tags: ['files'],
    summary: 'Upload a file',
    consumes: ['multipart/form-data'],
    response: {
      200: {
        type: 'object',
        properties: {
          url: { type: 'string' },
        },
      },
      400: { type: 'null' },
    },
  },
};
