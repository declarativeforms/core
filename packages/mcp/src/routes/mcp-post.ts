import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { FormService, GitHubGateway } from '../core';
import { createDeclarativeFormsServer } from '../mcp';

export const MCP_POST: RouteOptions = {
  handler: async () => {},
  method: 'POST',
  onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getBearerToken(request.headers.authorization);

    if (!token) {
      await reply.header('WWW-Authenticate', 'Bearer').status(401).send();
      return;
    }

    const formService = new FormService(new GitHubGateway(token));
    const handler = toNodeHandler(
      createMcpHandler(() => createDeclarativeFormsServer(formService)),
    );

    reply.hijack();
    await handler(request.raw, reply.raw);
  },
  url: '/mcp',
};

function getBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
}
